import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.eclipse.jdt.core.compiler.CategorizedProblem;
import org.eclipse.jdt.internal.compiler.ASTVisitor;
import org.eclipse.jdt.internal.compiler.ClassFile;
import org.eclipse.jdt.internal.compiler.CompilationResult;
import org.eclipse.jdt.internal.compiler.Compiler;
import org.eclipse.jdt.internal.compiler.DefaultErrorHandlingPolicies;
import org.eclipse.jdt.internal.compiler.ast.Block;
import org.eclipse.jdt.internal.compiler.ast.CompilationUnitDeclaration;
import org.eclipse.jdt.internal.compiler.ast.DoStatement;
import org.eclipse.jdt.internal.compiler.ast.ForStatement;
import org.eclipse.jdt.internal.compiler.ast.ForeachStatement;
import org.eclipse.jdt.internal.compiler.ast.MessageSend;
import org.eclipse.jdt.internal.compiler.ast.SingleNameReference;
import org.eclipse.jdt.internal.compiler.ast.Statement;
import org.eclipse.jdt.internal.compiler.ast.WhileStatement;
import org.eclipse.jdt.internal.compiler.batch.CompilationUnit;
import org.eclipse.jdt.internal.compiler.classfmt.ClassFileReader;
import org.eclipse.jdt.internal.compiler.env.ICompilationUnit;
import org.eclipse.jdt.internal.compiler.env.INameEnvironment;
import org.eclipse.jdt.internal.compiler.env.NameEnvironmentAnswer;
import org.eclipse.jdt.internal.compiler.impl.CompilerOptions;
import org.eclipse.jdt.internal.compiler.lookup.BlockScope;
import org.eclipse.jdt.internal.compiler.parser.Parser;
import org.eclipse.jdt.internal.compiler.problem.DefaultProblemFactory;
import org.eclipse.jdt.internal.compiler.problem.ProblemReporter;

/**
 * Компиляция и запуск кода студента: в браузере (CheerpJ, библиотечный режим в Web Worker)
 * и локально при проверке контента (java -cp driver.jar:ecj.jar JavaZeroRunner check ...).
 *
 * Классы Java 17 берутся из java17-api.jar (сигнатуры java.base из ct.sym), а не из образа JDK:
 * у CheerpJ его нет. Ответы — JSON-строки, чтобы JS не зависел от Java-объектов.
 */
public class JavaZeroRunner {
    /** Вспомогательный класс, который компилируется вместе с кодом студента. */
    static final String GUARD_CLASS = "__JZ";
    static final String GUARD_SOURCE =
        "public final class __JZ {\n"
            + "    public static long deadline = Long.MAX_VALUE;\n"
            + "    public static void tick() {\n"
            + "        if (System.nanoTime() > deadline) throw new __JZTimeout();\n"
            + "    }\n"
            + "    public static void exit(int status) { throw new __JZExit(status); }\n"
            + "}\n"
            + "final class __JZTimeout extends Error {\n"
            + "    __JZTimeout() { super(\"time limit\"); }\n"
            + "}\n"
            + "final class __JZExit extends Error {\n"
            + "    final int status;\n"
            + "    __JZExit(int status) { super(\"System.exit(\" + status + \")\"); this.status = status; }\n"
            + "}\n";

    static final int OUTPUT_LIMIT = 64 * 1024;

    private static Map<String, byte[]> api;
    private static Set<String> apiPackages;
    private static Map<String, byte[]> runnable = new HashMap<>();
    private static String runnableMain;

    // ---------- API для JS ----------

    public static String ping() {
        return "{\"java\":" + q(System.getProperty("java.version")) + "}";
    }

    /** Загружает API Java 17 в память один раз. */
    public static String loadApi(String jarPath) throws IOException {
        long t = System.nanoTime();
        if (api == null) {
            Map<String, byte[]> classes = new HashMap<>();
            Set<String> packages = new HashSet<>();
            try (ZipInputStream zin = new ZipInputStream(new ByteArrayInputStream(Files.readAllBytes(Paths.get(jarPath))))) {
                for (ZipEntry e; (e = zin.getNextEntry()) != null; ) {
                    String n = e.getName();
                    if (!n.endsWith(".class")) continue;
                    classes.put(n.substring(0, n.length() - 6), zin.readAllBytes());
                    for (int s = n.lastIndexOf('/'); s > 0; s = n.lastIndexOf('/', s - 1)) packages.add(n.substring(0, s));
                }
            }
            api = classes;
            apiPackages = packages;
        }
        return "{\"classes\":" + api.size() + ",\"ms\":" + ms(t) + "}";
    }

    /**
     * Компилирует исходник: диагностика — по исходному тексту (позиции совпадают с редактором),
     * запускается версия с защитой циклов. Возвращает {compiled, diagnostics[], ms}.
     */
    public static String compile(String fileName, String source) {
        long t = System.nanoTime();
        runnable = new HashMap<>();
        runnableMain = fileName.endsWith(".java") ? fileName.substring(0, fileName.length() - 5) : fileName;
        try {
            List<String> diagnostics = new ArrayList<>();
            Map<String, byte[]> plain = new HashMap<>();
            boolean ok = compileUnits(new ICompilationUnit[] { unit(fileName, source) }, plain, diagnostics, true);
            if (ok) {
                String guarded = instrument(fileName, source);
                List<String> ignored = new ArrayList<>();
                Map<String, byte[]> classes = new HashMap<>();
                if (!compileUnits(new ICompilationUnit[] { unit(fileName, guarded), unit(GUARD_CLASS + ".java", GUARD_SOURCE) }, classes, ignored, false)) {
                    return "{\"compiled\":false,\"ms\":" + ms(t) + ",\"diagnostics\":[],\"fatal\":" + q("instrumentation failed: " + String.join("; ", ignored)) + "}";
                }
                runnable = classes;
            }
            return "{\"compiled\":" + ok + ",\"ms\":" + ms(t) + ",\"diagnostics\":[" + String.join(",", diagnostics) + "]}";
        } catch (Throwable e) {
            return "{\"compiled\":false,\"ms\":" + ms(t) + ",\"diagnostics\":[],\"fatal\":" + q(String.valueOf(e)) + "}";
        }
    }

    /**
     * Запускает последнюю скомпилированную программу для каждого ввода (вводы разделены \u0000).
     * Возвращает [{status: ok|exception|timeout|exit|output_limit|error, exitCode, stdout, error, ms}].
     */
    public static String run(String stdinsJoined, int timeoutMs) {
        String[] stdins = stdinsJoined.split("\u0000", -1);
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < stdins.length; i++) {
            if (i > 0) json.append(',');
            json.append(runOne(stdins[i], timeoutMs));
        }
        return json.append(']').toString();
    }

    // ---------- Компиляция ----------

    private static ICompilationUnit unit(String fileName, String source) {
        return new CompilationUnit(source.toCharArray(), fileName, "UTF-8");
    }

    private static CompilerOptions options() {
        Map<String, String> s = new HashMap<>();
        s.put(CompilerOptions.OPTION_Compliance, CompilerOptions.VERSION_17);
        s.put(CompilerOptions.OPTION_Source, CompilerOptions.VERSION_17);
        s.put(CompilerOptions.OPTION_TargetPlatform, CompilerOptions.VERSION_17);
        s.put(CompilerOptions.OPTION_Encoding, "UTF-8");
        // Предупреждения, которые только отвлекают новичка
        s.put(CompilerOptions.OPTION_ReportUnusedImport, CompilerOptions.IGNORE);
        s.put(CompilerOptions.OPTION_ReportUnusedLocal, CompilerOptions.IGNORE);
        s.put(CompilerOptions.OPTION_ReportUnusedPrivateMember, CompilerOptions.IGNORE);
        s.put(CompilerOptions.OPTION_ReportUnclosedCloseable, CompilerOptions.IGNORE);
        s.put(CompilerOptions.OPTION_ReportPotentiallyUnclosedCloseable, CompilerOptions.IGNORE);
        s.put(CompilerOptions.OPTION_ReportRawTypeReference, CompilerOptions.IGNORE);
        s.put(CompilerOptions.OPTION_ReportUncheckedTypeOperation, CompilerOptions.IGNORE);
        s.put(CompilerOptions.OPTION_ReportDeadCode, CompilerOptions.IGNORE);
        return new CompilerOptions(s);
    }

    private static boolean compileUnits(ICompilationUnit[] units, Map<String, byte[]> out, List<String> diagnostics, boolean collect) {
        boolean[] hasErrors = { false };
        INameEnvironment env = new ApiEnvironment();
        Compiler compiler = new Compiler(env, DefaultErrorHandlingPolicies.proceedWithAllProblems(), options(),
            (CompilationResult result) -> {
                if (result.getProblems() != null) {
                    for (CategorizedProblem p : result.getProblems()) {
                        if (p.isError()) hasErrors[0] = true;
                        if (collect) {
                            diagnostics.add("{\"severity\":\"" + (p.isError() ? "error" : "warning") + "\",\"line\":" + p.getSourceLineNumber()
                                + ",\"start\":" + p.getSourceStart() + ",\"end\":" + p.getSourceEnd() + ",\"message\":" + q(p.getMessage()) + "}");
                        } else if (p.isError()) {
                            diagnostics.add(p.getMessage());
                        }
                    }
                }
                if (!result.hasErrors()) {
                    for (ClassFile cf : result.getClassFiles()) out.put(join(cf.getCompoundName(), '.'), cf.getBytes());
                }
            },
            new DefaultProblemFactory(Locale.ROOT));
        compiler.compile(units);
        return !hasErrors[0];
    }

    /** Классы — из java17-api.jar; всё остальное компилятор берёт из переданных исходников. */
    static final class ApiEnvironment implements INameEnvironment {
        @Override public NameEnvironmentAnswer findType(char[][] compound) { return find(join(compound, '/')); }
        @Override public NameEnvironmentAnswer findType(char[] typeName, char[][] pkg) {
            String p = join(pkg, '/');
            return find(p.isEmpty() ? new String(typeName) : p + "/" + new String(typeName));
        }
        @Override public boolean isPackage(char[][] parent, char[] name) {
            String p = join(parent, '/');
            return apiPackages.contains(p.isEmpty() ? new String(name) : p + "/" + new String(name));
        }
        @Override public void cleanup() { }
        private NameEnvironmentAnswer find(String binaryName) {
            byte[] bytes = api.get(binaryName);
            if (bytes == null) return null;
            try {
                return new NameEnvironmentAnswer(new ClassFileReader(bytes, (binaryName + ".class").toCharArray()), null);
            } catch (Exception e) {
                return null;
            }
        }
    }

    // ---------- Защита: проверка времени в циклах, запрет System.exit ----------

    /**
     * Вставляет __JZ.tick() в тело каждого цикла и заменяет System.exit на __JZ.exit.
     * Переводов строк не добавляет — номера строк в ошибках выполнения совпадают с редактором.
     */
    static String instrument(String fileName, String source) {
        CompilerOptions opts = options();
        ProblemReporter reporter = new ProblemReporter(DefaultErrorHandlingPolicies.proceedWithAllProblems(), opts, new DefaultProblemFactory(Locale.ROOT));
        Parser parser = new Parser(reporter, true);
        ICompilationUnit cu = unit(fileName, source);
        CompilationUnitDeclaration unit = parser.parse(cu, new CompilationResult(cu, 0, 0, opts.maxProblemsPerUnit));
        parser.getMethodBodies(unit);

        List<int[]> inserts = new ArrayList<>(); // {позиция, код вставки}
        final int OPEN = 0, OPEN_WRAP = 1, CLOSE_WRAP = 2, EXIT = 3;
        ASTVisitor visitor = new ASTVisitor() {
            private void guard(Statement body) {
                if (body == null) return;
                if (body instanceof Block) {
                    inserts.add(new int[] { body.sourceStart + 1, OPEN });
                } else {
                    inserts.add(new int[] { body.sourceStart, OPEN_WRAP });
                    inserts.add(new int[] { statementEnd(source, body), CLOSE_WRAP });
                }
            }
            @Override public boolean visit(ForStatement s, BlockScope scope) { guard(s.action); return true; }
            @Override public boolean visit(ForeachStatement s, BlockScope scope) { guard(s.action); return true; }
            @Override public boolean visit(WhileStatement s, BlockScope scope) { guard(s.action); return true; }
            @Override public boolean visit(DoStatement s, BlockScope scope) { guard(s.action); return true; }
            @Override public boolean visit(MessageSend m, BlockScope scope) {
                if (m.receiver instanceof SingleNameReference ref && "System".equals(new String(ref.token)) && "exit".equals(new String(m.selector))) {
                    inserts.add(new int[] { ref.sourceStart, EXIT });
                }
                return true;
            }
        };
        unit.traverse(visitor, null, false);

        // С конца к началу, чтобы вставки не сдвигали ещё не обработанные позиции
        inserts.sort((a, b) -> a[0] != b[0] ? Integer.compare(b[0], a[0]) : Integer.compare(b[1], a[1]));
        StringBuilder out = new StringBuilder(source);
        for (int[] ins : inserts) {
            switch (ins[1]) {
                case OPEN -> out.insert(ins[0], " __JZ.tick();");
                case OPEN_WRAP -> out.insert(ins[0], "{ __JZ.tick(); ");
                case CLOSE_WRAP -> out.insert(ins[0], " }");
                case EXIT -> out.replace(ins[0], ins[0] + "System".length(), GUARD_CLASS);
                default -> { }
            }
        }
        return out.toString();
    }

    /**
     * Конец оператора (не включительно) вместе с «;». У выражений вроде x++ ECJ не включает точку с запятой
     * в sourceEnd, поэтому ищем её дальше, пропуская пробелы и комментарии.
     */
    static int statementEnd(String src, Statement body) {
        int end = body.sourceEnd + 1;
        int i = end;
        while (i < src.length()) {
            char c = src.charAt(i);
            if (Character.isWhitespace(c)) {
                i++;
            } else if (src.startsWith("//", i)) {
                i = src.indexOf('\n', i);
                if (i < 0) return end;
            } else if (src.startsWith("/*", i)) {
                int close = src.indexOf("*/", i + 2);
                if (close < 0) return end;
                i = close + 2;
            } else {
                break;
            }
        }
        return i < src.length() && src.charAt(i) == ';' ? i + 1 : end;
    }

    // ---------- Запуск ----------

    private static String runOne(String stdin, int timeoutMs) {
        LimitedOutput buf = new LimitedOutput(OUTPUT_LIMIT);
        PrintStream realOut = System.out;
        PrintStream realErr = System.err;
        InputStream realIn = System.in;
        PrintStream capture = new PrintStream(buf, true, StandardCharsets.UTF_8);
        long t = System.nanoTime();
        String status = "ok";
        String error = "";
        int exitCode = 0;
        try {
            if (runnable.isEmpty()) throw new IllegalStateException("nothing compiled");
            ClassLoader loader = new MemoryClassLoader(runnable);
            loader.loadClass(GUARD_CLASS).getField("deadline").setLong(null, System.nanoTime() + timeoutMs * 1_000_000L);
            Method main = loader.loadClass(runnableMain).getMethod("main", String[].class);
            System.setIn(new ByteArrayInputStream(stdin.getBytes(StandardCharsets.UTF_8)));
            System.setOut(capture);
            System.setErr(capture);
            main.invoke(null, (Object) new String[0]);
        } catch (InvocationTargetException e) {
            Throwable cause = e.getCause();
            String type = cause.getClass().getName();
            if (type.equals("__JZTimeout")) {
                status = "timeout";
            } else if (type.equals("__JZExit")) {
                status = "exit";
                exitCode = exitStatus(cause);
            } else if (cause instanceof OutputLimitError) {
                status = "output_limit";
            } else {
                status = "exception";
                error = describe(cause);
            }
        } catch (Throwable e) {
            status = "error";
            error = String.valueOf(e);
        } finally {
            capture.flush();
            System.setOut(realOut);
            System.setErr(realErr);
            System.setIn(realIn);
        }
        return "{\"status\":" + q(status) + ",\"exitCode\":" + exitCode + ",\"ms\":" + ms(t) + ",\"error\":" + q(error)
            + ",\"stdout\":" + q(buf.text()) + "}";
    }

    private static int exitStatus(Throwable exit) {
        try {
            // __JZExit загружен другим загрузчиком классов — без setAccessible поле не прочитать
            java.lang.reflect.Field status = exit.getClass().getDeclaredField("status");
            status.setAccessible(true);
            return status.getInt(exit);
        } catch (ReflectiveOperationException | RuntimeException e) {
            return 0;
        }
    }

    /** Исключение и строка кода студента, где оно возникло. */
    private static String describe(Throwable e) {
        StringBuilder b = new StringBuilder(String.valueOf(e));
        for (StackTraceElement el : e.getStackTrace()) {
            String cls = el.getClassName();
            if (cls.equals(runnableMain) || cls.startsWith(runnableMain + "$")) {
                b.append("\n\tat ").append(el.getMethodName()).append(" (строка ").append(el.getLineNumber()).append(')');
                break;
            }
        }
        return b.toString();
    }

    static final class MemoryClassLoader extends ClassLoader {
        private final Map<String, byte[]> classes;
        MemoryClassLoader(Map<String, byte[]> classes) {
            super(JavaZeroRunner.class.getClassLoader());
            this.classes = classes;
        }
        @Override protected Class<?> findClass(String name) throws ClassNotFoundException {
            byte[] b = classes.get(name);
            if (b == null) throw new ClassNotFoundException(name);
            return defineClass(name, b, 0, b.length);
        }
    }

    static final class OutputLimitError extends Error {
        OutputLimitError() { super("output limit"); }
    }

    /** Буфер вывода с ограничением: бесконечный println не должен съесть память. */
    static final class LimitedOutput extends OutputStream {
        private final ByteArrayOutputStream buf = new ByteArrayOutputStream();
        private final int limit;
        LimitedOutput(int limit) { this.limit = limit; }
        @Override public void write(int b) {
            if (buf.size() >= limit) throw new OutputLimitError();
            buf.write(b);
        }
        @Override public void write(byte[] b, int off, int len) {
            if (buf.size() + len > limit) {
                buf.write(b, off, Math.max(0, limit - buf.size()));
                throw new OutputLimitError();
            }
            buf.write(b, off, len);
        }
        String text() { return buf.toString(StandardCharsets.UTF_8); }
    }

    // ---------- Утилиты ----------

    private static long ms(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000;
    }

    private static String join(char[][] parts, char sep) {
        StringBuilder b = new StringBuilder();
        if (parts != null) {
            for (char[] p : parts) {
                if (b.length() > 0) b.append(sep);
                b.append(p);
            }
        }
        return b.toString();
    }

    static String q(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> b.append("\\\"");
                case '\\' -> b.append("\\\\");
                case '\n' -> b.append("\\n");
                case '\r' -> b.append("\\r");
                case '\t' -> b.append("\\t");
                default -> {
                    if (c < 0x20) b.append(String.format("\\u%04x", (int) c));
                    else b.append(c);
                }
            }
        }
        return b.append('"').toString();
    }

    /**
     * Проверка контента локальным JDK:
     * JavaZeroRunner check <java17-api.jar> <FileName.java> <source-file> <timeoutMs> [stdin-file ...]
     * Печатает {"compile": {...}, "run": [...]}.
     */
    public static void main(String[] args) throws Exception {
        if (args.length < 5 || !args[0].equals("check")) {
            System.err.println("usage: JavaZeroRunner check <api.jar> <FileName.java> <source-file> <timeoutMs> [stdin-file ...]");
            System.exit(2);
        }
        loadApi(args[1]);
        String source = Files.readString(Paths.get(args[3]), StandardCharsets.UTF_8);
        String compiled = compile(args[2], source);
        String runs = "[]";
        if (compiled.startsWith("{\"compiled\":true")) {
            List<String> stdins = new ArrayList<>();
            for (int i = 5; i < args.length; i++) stdins.add(Files.readString(Paths.get(args[i]), StandardCharsets.UTF_8));
            runs = stdins.isEmpty() ? "[]" : run(String.join("\u0000", stdins), Integer.parseInt(args[4]));
        }
        PrintStream out = new PrintStream(new java.io.FileOutputStream(java.io.FileDescriptor.out), true, StandardCharsets.UTF_8);
        out.println("{\"compile\":" + compiled + ",\"run\":" + runs + "}");
    }
}
