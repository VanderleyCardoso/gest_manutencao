// server.js - Backend para Gestão de Manutenção (COM TODAS AS ROTAS E CORREÇÕES FINAIS)

// 1. Importar módulos necessários
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// 2. Configurar o middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 3. Configurar a conexão com o banco de dados MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Vandek01810!', // <-- MUDE PARA A SUA SENHA
    database: 'gest_manutencao'
};

let connection;

async function connectToDatabase() {
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Conectado ao banco de dados MySQL com sucesso!');
    } catch (err) {
        console.error('Erro ao conectar ao banco de dados MySQL:', err);
        process.exit(1);
    }
}

connectToDatabase();

// 4. Servir os arquivos estáticos do Frontend (da pasta 'public')
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =================================================================
// ENDPOINTS DA API
// =================================================================

// --- EQUIPAMENTOS ---
app.get('/api/equipamentos', async (req, res) => {
    try {
        const [rows] = await connection.execute('SELECT id, nome, setor, status, ultima_manutencao, data_cadastro FROM equipamentos ORDER BY nome ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar equipamentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar equipamentos.' });
    }
});

app.post('/api/equipamentos', async (req, res) => {
    const { nome, setor, status } = req.body;
    if (!nome || !status) {
        return res.status(400).json({ message: 'Nome e Status do equipamento são obrigatórios.' });
    }
    try {
        const [result] = await connection.execute(
            'INSERT INTO equipamentos (nome, setor, status, data_cadastro) VALUES (?, ?, ?, NOW())',
            [nome, setor || null, status]
        );
        res.status(201).json({ message: 'Equipamento adicionado com sucesso!', id: result.insertId });
    } catch (error) {
        console.error('Erro ao adicionar novo equipamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao adicionar equipamento.', error: error.message });
    }
});

app.delete('/api/equipamentos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await connection.execute('DELETE FROM equipamentos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Equipamento não encontrado.' });
        }
        res.status(200).json({ message: 'Equipamento excluído com sucesso!' });
    } catch (error) {
        console.error(`Erro ao excluir equipamento ID ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir equipamento.', error: error.message });
    }
});

app.get('/api/equipamentos/:id/historico-manutencoes', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await connection.execute(
            'SELECT id, tipo_os as tipo_problema, descricao, status, data_abertura FROM ordens_servico WHERE equipamento_id = ? ORDER BY data_abertura DESC',
            [id]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error(`Erro ao buscar histórico de manutenções para o equipamento ID ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});


// --- ORDENS DE SERVIÇO ---
app.get('/api/ordens-servico', async (req, res) => {
    const { status } = req.query; 
    let query = 'SELECT os.*, e.nome AS equipamento_nome, t.nome as tecnico_nome FROM ordens_servico os JOIN equipamentos e ON os.equipamento_id = e.id LEFT JOIN tecnicos t ON os.tecnico_id = t.id';
    const params = [];
    if (status) {
        query += ' WHERE FIND_IN_SET(os.status, ?)';
        params.push(status);
    }
    query += ' ORDER BY os.data_abertura DESC';
    try {
        const [rows] = await connection.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar ordens de serviço:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar ordens de serviço.' });
    }
});

app.get('/api/ordens-servico/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await connection.execute('SELECT * FROM ordens_servico WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`Erro ao buscar Ordem de Serviço ID ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

app.post('/api/ordens-servico', async (req, res) => {
    const { equipamento_id, tipo_os, descricao, prioridade, tecnico_id } = req.body;
    if (!equipamento_id || !tipo_os || !descricao || !prioridade) {
        return res.status(400).json({ message: 'Campos (equipamento, tipo, descricao, prioridade) são obrigatórios.' });
    }
    try {
        const [result] = await connection.execute(
            'INSERT INTO ordens_servico (equipamento_id, tipo_os, descricao, status, prioridade, tecnico_id, data_abertura) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [equipamento_id, tipo_os, descricao, 'Pendente', prioridade, tecnico_id || null]
        );
        res.status(201).json({ message: 'Ordem de Serviço criada com sucesso!', id: result.insertId });
    } catch (error) {
        console.error('Erro ao criar nova Ordem de Serviço:', error);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});

app.put('/api/ordens-servico/:id', async (req, res) => {
    const { id } = req.params;
    const { equipamento_id, tipo_os, descricao, status, prioridade, tecnico_id, data_conclusao, data_aceite } = req.body;
    if (!equipamento_id || !tipo_os || !descricao || !status || !prioridade) {
        return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    }
    try {
        const [result] = await connection.execute(
            'UPDATE ordens_servico SET equipamento_id = ?, tipo_os = ?, descricao = ?, status = ?, prioridade = ?, tecnico_id = ?, data_conclusao = ?, data_aceite = ? WHERE id = ?',
            [equipamento_id, tipo_os, descricao, status, prioridade, tecnico_id || null, data_conclusao || null, data_aceite || null, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
        }
        res.status(200).json({ message: 'Ordem de Serviço atualizada com sucesso!' });
    } catch (error) {
        console.error(`Erro ao atualizar Ordem de Serviço ID ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});

app.delete('/api/ordens-servico/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await connection.execute('DELETE FROM ordens_servico WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
        }
        res.status(200).json({ message: 'Ordem de Serviço excluída com sucesso!' });
    } catch (error) {
        console.error(`Erro ao excluir Ordem de Serviço ID ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});


// --- TÉCNICOS ---
app.get('/api/tecnicos', async (req, res) => {
    try {
        const [rows] = await connection.execute('SELECT id, nome, especialidade, contato, status FROM tecnicos ORDER BY nome ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar técnicos:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar técnicos.' });
    }
});

app.get('/api/tecnicos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await connection.execute('SELECT * FROM tecnicos WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Técnico não encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`Erro ao buscar técnico ID ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

app.post('/api/tecnicos', async (req, res) => {
    const { nome, especialidade, contato, status } = req.body;
    if (!nome) {
        return res.status(400).json({ message: 'O nome do técnico é obrigatório.' });
    }
    try {
        const [result] = await connection.execute(
            'INSERT INTO tecnicos (nome, especialidade, contato, status) VALUES (?, ?, ?, ?)',
            [nome, especialidade || null, contato || null, status || 'Ativo']
        );
        res.status(201).json({ message: 'Técnico adicionado com sucesso!', id: result.insertId });
    } catch (error) {
        console.error('Erro ao adicionar técnico:', error);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});

app.put('/api/tecnicos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, especialidade, contato, status } = req.body;
    if (!nome) {
        return res.status(400).json({ message: 'O nome do técnico é obrigatório.' });
    }
    try {
        const [result] = await connection.execute(
            'UPDATE tecnicos SET nome = ?, especialidade = ?, contato = ?, status = ? WHERE id = ?',
            [nome, especialidade || null, contato || null, status || 'Ativo', id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Técnico não encontrado.' });
        }
        res.status(200).json({ message: 'Técnico atualizado com sucesso!' });
    } catch (error) {
        console.error(`Erro ao atualizar técnico ID ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});

app.delete('/api/tecnicos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Antes de excluir, desvincule o técnico das ordens de serviço
        await connection.execute('UPDATE ordens_servico SET tecnico_id = NULL WHERE tecnico_id = ?', [id]);
        
        const [result] = await connection.execute('DELETE FROM tecnicos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Técnico não encontrado.' });
        }
        res.status(200).json({ message: 'Técnico excluído com sucesso!' });
    } catch (error) {
        console.error(`Erro ao excluir técnico ID ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});


// --- CONFIGURAÇÕES ---
app.put('/api/configuracoes', async (req, res) => {
    const configData = req.body;
    console.log('Dados de configuração recebidos (para simular salvamento):', configData);
    res.status(200).json({ message: 'Configurações recebidas com sucesso!', data: configData });
});


// --- DASHBOARD ---
app.get('/api/dashboard-metrics', async (req, res) => {
    try {
        const metrics = {};
        const [equipamentos] = await connection.execute('SELECT id, nome, status, ultima_manutencao, data_cadastro, setor FROM equipamentos');
        metrics.totalEquipamentosAtivos = equipamentos.filter(e => e.status === 'Ativo').length;
        metrics.equipamentos = equipamentos;
        const [ordensAbertas] = await connection.execute("SELECT COUNT(*) AS count FROM ordens_servico WHERE status = 'Em Andamento'");
        metrics.totalOrdensAbertas = ordensAbertas[0].count;
        const [manutencoesPendentes] = await connection.execute("SELECT COUNT(*) AS count FROM ordens_servico WHERE status = 'Pendente'");
        metrics.totalManutencoesPendentes = manutencoesPendentes[0].count;
        const [tecnicos] = await connection.execute('SELECT id, nome, especialidade, contato, status FROM tecnicos');
        const tecnicosAtivos = tecnicos.filter(t => t.status === 'Ativo');
        metrics.mecanicosAtivos = tecnicosAtivos.filter(t => t.especialidade === 'Mecânico').length;
        metrics.eletricistasAtivos = tecnicosAtivos.filter(t => t.especialidade === 'Eletricista').length;
        metrics.tecnicos = tecnicos;
        const today = new Date().toISOString().split('T')[0];
        const [osConcluidasHoje] = await connection.execute("SELECT COUNT(*) AS count FROM ordens_servico WHERE status = 'Concluída' AND DATE(data_conclusao) = ?", [today]);
        metrics.chamadosFechadosHoje = osConcluidasHoje[0].count;
        const [manutencoesPorMes] = await connection.execute(`
            SELECT DATE_FORMAT(data_abertura, '%Y-%m') AS mes_ano,
                   SUM(CASE WHEN tipo_os = 'Preventiva' THEN 1 ELSE 0 END) AS preventiva_count,
                   SUM(CASE WHEN tipo_os = 'Corretiva' THEN 1 ELSE 0 END) AS corretiva_count
            FROM ordens_servico GROUP BY mes_ano ORDER BY mes_ano DESC LIMIT 6
        `);
        metrics.manutencoesPorMes = manutencoesPorMes.reverse();
        const [equipamentosPorSetor] = await connection.execute("SELECT setor, COUNT(*) AS count FROM equipamentos WHERE setor IS NOT NULL AND setor != '' GROUP BY setor ORDER BY count DESC");
        metrics.equipamentosPorSetor = equipamentosPorSetor;
        const [manutencoesPorStatus] = await connection.execute("SELECT status, COUNT(*) AS count FROM ordens_servico GROUP BY status ORDER BY count DESC");
        metrics.manutencoesPorStatus = manutencoesPorStatus;
        const [topEquipamentosOS] = await connection.execute(`
            SELECT e.nome AS equipamento_nome, COUNT(os.id) AS os_count
            FROM ordens_servico os JOIN equipamentos e ON os.equipamento_id = e.id
            GROUP BY e.nome ORDER BY os_count DESC LIMIT 5
        `);
        metrics.topEquipamentosOS = topEquipamentosOS;
        const [recentOrders] = await connection.execute(`
            SELECT 'Ordem de Serviço' AS type, os.id, e.nome AS related_entity, os.descricao, os.status,
                   os.data_abertura AS date, t.nome AS responsible
            FROM ordens_servico os
            JOIN equipamentos e ON os.equipamento_id = e.id
            LEFT JOIN tecnicos t ON os.tecnico_id = t.id
            ORDER BY os.data_abertura DESC LIMIT 5
        `);
        metrics.recentActivities = recentOrders.map(activity => ({
            ...activity,
            description: `${activity.type} #${activity.id} - ${activity.descricao ? activity.descricao.substring(0, 50) : ''}... no ${activity.related_entity}`
        }));
        res.status(200).json(metrics);
    } catch (error) {
        console.error('Erro ao buscar métricas do Dashboard:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar métricas.' });
    }
});


// 6. Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor Express rodando em http://localhost:${port}`);
});