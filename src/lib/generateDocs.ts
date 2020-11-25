import {
    Connection,
    ConnectionOptionsReader,
    EntityMetadata,
    getConnectionManager
} from "typeorm";
import { ConnectionMetadataBuilder } from "typeorm/connection/ConnectionMetadataBuilder";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";
import * as path from "path";
import * as fs from "fs";

export async function generateDocs(
    root: string,
    configFile: string,
    outputFile: string
) {
    if (!(root && configFile && outputFile)) {
        throw new Error("Invalid"); // TODO: ちゃんと
    }
    const cwd = path.resolve( process.cwd(), root );
    console.log(cwd)
    process.chdir( cwd );
    const connectionOptionsReader = new ConnectionOptionsReader({
        root: process.cwd(),
        configName: configFile
    });
    const connectionOptions = await connectionOptionsReader.get("default");
    const conn = getConnectionManager().create(connectionOptions);
    const connectionMetadataBuilder = new ConnectionMetadataBuilder(conn);

    const entityMetadata = connectionMetadataBuilder.buildEntityMetadatas(
        conn.options.entities || []
    );

    const mg = new MarkdownGenerator();
    const md = mg.generate(entityMetadata, conn);
    fs.writeFileSync(path.resolve(process.cwd(), outputFile), md, "utf-8");
}

class MarkdownGenerator {
    generate(em: EntityMetadata[], conn: Connection) {
        return em.map(e => {
            const md = this.createMarkdownTable({
                tableName: e.tableName,
                headers: ["項目名", "タイプ", "コメント"],
                rows: e.columns.map(c => [
                    c.databaseName,
                    this.getType(c, conn),
                    c.comment||"なし"
                ])
            });
            return md;
        }).join("\n\n");
    }

    private getType(column: ColumnMetadata, conn: Connection) {
        const type = conn.driver.normalizeType(column);
        return type;
    }

    createMarkdownTable(params: {
        tableName: string;
        headers: string[];
        rows: string[][];
    }) {
        const { tableName, headers, rows } = params;
        //   if (headers.length !== rows.length) {
        //     throw new Error("Invalid rows");
        //   }
        return `
### ${tableName}

${headers.join(" | ")}
${headers.map(() => "--").join(" | ")}
${rows.map(r => r.join(" | ")).join("\n")}`;
    }
}
