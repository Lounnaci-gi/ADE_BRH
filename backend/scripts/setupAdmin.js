const { Connection, Request, TYPES } = require('tedious');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const getConfig = () => ({
    server: process.env.DB_SERVER || 'localhost',
    authentication: {
        type: 'default',
        options: {
            userName: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        }
    },
    options: {
        database: process.env.DB_DATABASE,
        trustServerCertificate: true,
        encrypt: false,
        instanceName: 'SQLEXPRESS',
        enableArithAbort: true
    }
});

async function upsertAdmin() {
    const username = 'admin';
    const password = 'admin123';
    const email = 'admin@ade.dz';

    const hash = await bcrypt.hash(password, 10);

    const connection = new Connection(getConfig());

    await new Promise((resolve, reject) => {
        connection.on('connect', (err) => (err ? reject(err) : resolve()));
        connection.connect();
    });

    const query = `
        IF NOT EXISTS (SELECT 1 FROM dbo.DIM_UTILISATEUR WHERE Nom_Utilisateur = @username)
        BEGIN
            INSERT INTO dbo.DIM_UTILISATEUR 
                (Nom_Utilisateur, Mot_de_Passe_Hash, FK_Agence, [Role], Email, IsActive)
            VALUES 
                (@username, @hash, NULL, 'Administrateur', @email, 1)
        END
        ELSE
        BEGIN
            UPDATE dbo.DIM_UTILISATEUR
            SET Mot_de_Passe_Hash = @hash,
                Email = @email,
                IsActive = 1,
                [Role] = 'Administrateur',
                FK_Agence = NULL
            WHERE Nom_Utilisateur = @username
        END
        SELECT 1 as Done
    `;

    await new Promise((resolve, reject) => {
        const request = new Request(query, (err) => {
            connection.close();
            if (err) return reject(err);
            resolve();
        });

        request.addParameter('username', TYPES.NVarChar, username);
        request.addParameter('hash', TYPES.VarBinary, Buffer.from(hash));
        request.addParameter('email', TYPES.NVarChar, email);

        connection.execSql(request);
    });

    console.log('Admin user ensured: username=admin, password=admin123');
}

upsertAdmin().catch((err) => {
    console.error('Failed to upsert admin:', err.message);
    process.exit(1);
});


