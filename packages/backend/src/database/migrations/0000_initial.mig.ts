import { readFileSync } from 'fs';
import { join } from 'path';
import { Sequelize } from 'sequelize';

export const up = async (sequelize: Sequelize): Promise<void> => {
    const dialect = sequelize.getDialect();
    const content: string = readFileSync(join(__dirname, `./sql/${dialect}/init.sql`)).toString();
    const statements = content.split(';\n');
    for (const st of statements) {
        if (st && st.trim()) {
            await sequelize.query(st);
        }
    }
};

export const down = async (sequelize: Sequelize): Promise<void> => {
    //  initial database setup, no down statements
};
