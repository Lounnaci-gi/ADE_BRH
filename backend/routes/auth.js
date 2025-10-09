const { Connection, Request, TYPES } = require('tedious');
const bcrypt = require('bcryptjs');

// Configuration de connexion (à importer depuis server.js ou .env)
const getConfig = () => ({
    server: 'user-PC',
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

// Route de login
const login = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username et password requis' });
    }

    const connection = new Connection(getConfig());

    connection.on('connect', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
        }

        let users = [];

        const query = `
            SELECT 
                UtilisateurId,
                Nom_Utilisateur,
                Mot_de_Passe_Hash,
                FK_Agence,
                [Role],
                Email,
                IsActive
            FROM dbo.DIM_UTILISATEUR
            WHERE Nom_Utilisateur = @username AND IsActive = 1
        `;

        const request = new Request(query, (err, rowCount) => {
            if (err) {
                connection.close();
                return res.status(500).json({ error: err.message });
            }

            if (users.length === 0) {
                connection.close();
                return res.status(401).json({ error: 'Utilisateur non trouvé ou inactif' });
            }

            const user = users[0];

            // Comparer le mot de passe
            bcrypt.compare(password, user.Mot_de_Passe_Hash.toString(), (err, isMatch) => {
                connection.close();

                if (err) {
                    return res.status(500).json({ error: 'Erreur lors de la vérification du mot de passe' });
                }

                if (isMatch) {
                    // Connexion réussie
                    return res.json({
                        success: true,
                        message: 'Connexion réussie',
                        user: {
                            id: user.UtilisateurId,
                            username: user.Nom_Utilisateur,
                            role: user.Role,
                            agenceId: user.FK_Agence,
                            email: user.Email
                        }
                    });
                } else {
                    return res.status(401).json({ error: 'Mot de passe incorrect' });
                }
            });
        });

        request.addParameter('username', TYPES.NVarChar, username);

        request.on('row', (columns) => {
            let row = {};
            columns.forEach(column => {
                row[column.metadata.colName] = column.value;
            });
            users.push(row);
        });

        connection.execSql(request);
    });

    connection.connect();
};

// Fonction pour créer/mettre à jour le hash du mot de passe admin
const updateAdminPassword = (req, res) => {
    const password = 'admin123'; // Mot de passe à hasher

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors du hashage' });
        }

        const connection = new Connection(getConfig());

        connection.on('connect', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur de connexion' });
            }

            const query = `
                UPDATE dbo.DIM_UTILISATEUR
                SET Mot_de_Passe_Hash = @hash
                WHERE Nom_Utilisateur = 'admin'
            `;

            const request = new Request(query, (err, rowCount) => {
                connection.close();

                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                return res.json({
                    success: true,
                    message: 'Mot de passe admin mis à jour',
                    rowsAffected: rowCount
                });
            });

            request.addParameter('hash', TYPES.VarBinary, Buffer.from(hash));

            connection.execSql(request);
        });

        connection.connect();
    });
};


// Fonction pour créer l'utilisateur admin initial
const createAdmin = (req, res) => {
    const username = 'admin';
    const password = 'admin123';
    const email = 'admin@ade.dz';

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors du hashage' });
        }

        const connection = new Connection(getConfig());

        connection.on('connect', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur de connexion' });
            }

            const query = `
                IF NOT EXISTS (SELECT 1 FROM dbo.DIM_UTILISATEUR WHERE Nom_Utilisateur = 'admin')
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
                        IsActive = 1
                    WHERE Nom_Utilisateur = @username
                END
                
                SELECT @@ROWCOUNT as RowsAffected
            `;

            let result = [];

            const request = new Request(query, (err, rowCount) => {
                connection.close();

                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                return res.json({
                    success: true,
                    message: 'Utilisateur admin créé/mis à jour avec succès',
                    username: username,
                    password: password,
                    result: result
                });
            });

            request.addParameter('username', TYPES.NVarChar, username);
            request.addParameter('hash', TYPES.VarBinary, Buffer.from(hash));
            request.addParameter('email', TYPES.NVarChar, email);

            request.on('row', (columns) => {
                let row = {};
                columns.forEach(column => {
                    row[column.metadata.colName] = column.value;
                });
                result.push(row);
            });

            connection.execSql(request);
        });

        connection.connect();
    });
};

module.exports = { login, updateAdminPassword, createAdmin };

