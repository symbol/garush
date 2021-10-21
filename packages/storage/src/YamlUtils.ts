import { promises as fsPromises, readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { dirname } from 'path';

export class YamlUtils {
    public static toYaml(object: unknown): string {
        return yaml.dump(object, {
            skipInvalid: true,
            indent: 2,
            lineWidth: 200,
            noArrayIndent: true,
            condenseFlow: true,
            noRefs: true,
        });
    }

    public static loadFileAsText(fileLocation: string): string {
        return readFileSync(fileLocation, 'utf8');
    }
    public static fromYaml(yamlString: string): unknown {
        return yaml.load(yamlString);
    }

    public static loadYaml(fileLocation: string): unknown {
        return this.fromYaml(this.loadFileAsText(fileLocation));
    }

    public static async writeYaml(fileName: string, object: unknown): Promise<void> {
        const yamlString = this.toYaml(object);
        await this.writeTextFile(fileName, yamlString);
    }

    public static async writeTextFile(path: string, text: string): Promise<void> {
        await this.mkdirParentFolder(path);
        await fsPromises.writeFile(path, text, 'utf8');
    }

    public static async mkdir(path: string): Promise<void> {
        await fsPromises.mkdir(path, { recursive: true });
    }

    public static async mkdirParentFolder(fileName: string): Promise<void> {
        const parentFolder = dirname(fileName);
        if (parentFolder) {
            await this.mkdir(parentFolder);
        }
    }
}
