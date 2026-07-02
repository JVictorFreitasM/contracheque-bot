// src/controllers/agendamentosController.js
const agendamentoLoteRepository = require('../repositories/agendamentoLoteRepository');

async function getAgendamentos(req, res) {
  try {
    const agendamentos = await agendamentoLoteRepository.listar();
    res.json({ data: agendamentos });
  } catch (err) {
    console.error('Erro ao listar agendamentos:', err);
    res.status(500).json({ error: 'Falha ao listar agendamentos' });
  }
}

async function cancelarAgendamento(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Identificador de agendamento inválido.' });
    }

    const agendamento = await agendamentoLoteRepository.buscarPorId(id);
    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }

    if (agendamento.status !== 'PENDENTE') {
      return res.status(400).json({ error: `Não é possível cancelar um agendamento com status ${agendamento.status}.` });
    }

    const atualizado = await agendamentoLoteRepository.cancelar(id);
    res.json({ success: true, agendamento: atualizado });
  } catch (err) {
    console.error('Erro ao cancelar agendamento:', err);
    res.status(500).json({ error: 'Falha ao cancelar agendamento' });
  }
}

module.exports = { getAgendamentos, cancelarAgendamento };
