import express from "express";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
const pool = new Pool({
    user: 'postgres', // Substitua pelo seu usuário do PostgreSQL
    host: 'localhost',
    database: 'trunfo-dino', // Nome da sua database
    password: 'senai', // Substitua pela sua senha
    port: 5433, // Porta padrão do PostgreSQL
});

// Habilitar CORS para todas as rotas
app.use(cors());
app.use(express.json());

// Rota para buscar todos os dinos
app.get('/dinos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM DINO');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar dinos' });
    }
});

// Rota para buscar um dino por ID
app.get('/dinos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Atualizado id_dino para id conforme a tabela
        const result = await pool.query('SELECT * FROM DINO WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Dino não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro interno ao buscar Dino' });
    }
});

// Rota para adicionar um dino
app.post('/add', async (req, res) => {
    // Adicionado fama e tipo
    const { nome, altura, comprimento, peso, velocidade, agilidade, longevidade, numero_magico, imagem, fama, tipo } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO DINO (NOME, ALTURA, COMPRIMENTO, PESO, VELOCIDADE, AGILIDADE, LONGEVIDADE, NUMERO_MAGICO, IMAGEM, FAMA, TIPO) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
            [nome, altura, comprimento, peso, velocidade, agilidade, longevidade, numero_magico, imagem, fama, tipo]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao adicionar Dino' });
    }
});

// Rota para atualizar um dino
app.put('/att/:id', async (req, res) => {
    const { id } = req.params;
    // Adicionado fama e tipo
    const { nome, altura, comprimento, peso, velocidade, agilidade, longevidade, numero_magico, imagem, fama, tipo } = req.body;
    try {
        const result = await pool.query(
            // Atualizado para incluir fama, tipo, e checar apenas 'id'
            'UPDATE DINO SET NOME = $1, ALTURA = $2, COMPRIMENTO = $3, PESO = $4, VELOCIDADE = $5, AGILIDADE = $6, LONGEVIDADE = $7, NUMERO_MAGICO = $8, IMAGEM = $9, FAMA = $10, TIPO = $11 WHERE ID = $12 RETURNING *',
            [nome, altura, comprimento, peso, velocidade, agilidade, longevidade, numero_magico, imagem, fama, tipo, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Dino não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao atualizar Dino' });
    }
});

// Rota para deletar um dino
app.delete('/del/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Atualizado id_dino para id conforme a tabela
        const result = await pool.query('DELETE FROM DINO WHERE ID = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Dino não encontrado' });
        }
        res.json({ message: 'Dino deletado com sucesso' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao deletar Dino' });
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});