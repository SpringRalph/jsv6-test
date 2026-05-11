const DEFAULT_FONT_SIZE = 12;

const reset = (fontSize: number) =>
    `color: inherit; font-weight: normal; font-size: ${fontSize}px`;

const tagStyle = (color: string, fontSize: number) =>
    `color: ${color}; font-weight: bold; font-size: ${fontSize}px`;

const buildLog = (color: string) =>
    (message: string, fontSize = DEFAULT_FONT_SIZE, ...args: unknown[]) => {
        console.log(`%c${message}`, tagStyle(color, fontSize), ...args);
    };

export class ColorConsoleHelper {
    static cyan(message: string, fontSize?: number, ...args: unknown[]) {
        buildLog("#00bcd4")(message, fontSize, ...args);
    }

    static green(message: string, fontSize?: number, ...args: unknown[]) {
        buildLog("#4caf50")(message, fontSize, ...args);
    }

    static orange(message: string, fontSize?: number, ...args: unknown[]) {
        buildLog("#ff9800")(message, fontSize, ...args);
    }

    static red(message: string, fontSize?: number, ...args: unknown[]) {
        console.error(`%c${message}`, tagStyle("#f44336", fontSize ?? DEFAULT_FONT_SIZE), ...args);
    }

    static purple(message: string, fontSize?: number, ...args: unknown[]) {
        buildLog("#9c27b0")(message, fontSize, ...args);
    }

    static blue(message: string, fontSize?: number, ...args: unknown[]) {
        buildLog("#2196f3")(message, fontSize, ...args);
    }

    static yellow(message: string, fontSize?: number, ...args: unknown[]) {
        buildLog("#ffeb3b")(message, fontSize, ...args);
    }

    static pink(message: string, fontSize?: number, ...args: unknown[]) {
        buildLog("#e91e63")(message, fontSize, ...args);
    }

    /** 两段拼色：标签用指定颜色，正文恢复默认 */
    static tag(
        tag: string,
        message: string,
        tagColor: string,
        fontSize = DEFAULT_FONT_SIZE,
        ...args: unknown[]
    ) {
        console.log(
            `%c${tag}%c ${message}`,
            tagStyle(tagColor, fontSize),
            reset(fontSize),
            ...args,
        );
    }
}
