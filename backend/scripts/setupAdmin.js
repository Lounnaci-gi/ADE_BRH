const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../utils/db');
const { TYPES } = db;

async function upsertAdmin() {
    const username = 'admin';
    const password = 'admin123';
    const email = 'admin@ade.dz';

    const hash = await bcrypt.hash(password, 10);

    await db.query(`
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
    `, [
        { name: 'username', type: TYPES.NVarChar, value: username },
        { name: 'hash', type: TYPES.VarBinary, value: Buffer.from(hash) },
        { name: 'email', type: TYPES.NVarChar, value: email }
    ]);

    console.log('Admin user ensured: username=admin, password=admin123');
}

upsertAdmin().catch((err) => {
    console.error('Failed to upsert admin:', err.message);
    process.exit(1);
});
