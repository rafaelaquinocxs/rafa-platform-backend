import { Request, Response } from 'express';
import Simulado from '../models/Simulado';
import Resultado from '../models/Resultado';

// Obter todos os simulados
export const getSimulados = async (req: Request, res: Response) => {
  try {
    const simulados = await Simulado.find({ ativo: true }).select('-questoes.respostaCorreta -questoes.explicacao');
    
    const simuladosBasicos = simulados.map(simulado => ({
      id: simulado._id,
      titulo: simulado.titulo,
      descricao: simulado.descricao,
      materias: simulado.materias,
      quantidadeQuestoes: simulado.questoes.length,
      tempoDuracao: simulado.tempoDuracao
    }));

    res.json({ simulados: simuladosBasicos });
  } catch (error) {
    console.error('Erro ao obter simulados:', error);
    res.status(500).json({ message: 'Erro ao obter simulados' });
  }
};

// Obter um simulado específico
export const getSimulado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const simulado = await Simulado.findById(id);
    if (!simulado) {
      return res.status(404).json({ message: 'Simulado não encontrado' });
    }

    res.json({ simulado });
  } catch (error) {
    console.error('Erro ao obter simulado:', error);
    res.status(500).json({ message: 'Erro ao obter simulado' });
  }
};

// Iniciar um simulado (retorna apenas as perguntas, sem as respostas)
export const iniciarSimulado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const simulado = await Simulado.findById(id);
    if (!simulado) {
      return res.status(404).json({ message: 'Simulado não encontrado' });
    }

    // Retornar apenas as perguntas, sem as respostas corretas
    const questoesSemRespostas = simulado.questoes.map(questao => ({
      id: questao._id,
      texto: questao.texto,
      opcoes: questao.opcoes,
      materia: questao.materia
    }));

    res.json({
      id: simulado._id,
      titulo: simulado.titulo,
      tempoDuracao: simulado.tempoDuracao,
      questoes: questoesSemRespostas
    });
  } catch (error) {
    console.error('Erro ao iniciar simulado:', error);
    res.status(500).json({ message: 'Erro ao iniciar simulado' });
  }
};

// Submeter respostas de um simulado
export const submeterRespostas = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { respostas, tempoGasto } = req.body;
    const userId = (req as any).user?.id; // Vem do middleware de auth
    
    const simulado = await Simulado.findById(id);
    if (!simulado) {
      return res.status(404).json({ message: 'Simulado não encontrado' });
    }

    // Calcular resultado
    let acertos = 0;
    const resultadoDetalhado = simulado.questoes.map(questao => {
      const respostaUsuario = respostas.find((r: any) => r.questaoId === questao._id?.toString())?.resposta;
      const acertou = respostaUsuario === questao.respostaCorreta;
      
      if (acertou) {
        acertos++;
      }

      return {
        questaoId: questao._id,
        acertou,
        respostaUsuario,
        respostaCorreta: questao.respostaCorreta,
        explicacao: questao.explicacao
      };
    });

    const percentualAcertos = Math.round((acertos / simulado.questoes.length) * 100);

    // Salvar resultado no banco de dados
    if (userId) {
      await Resultado.create({
        userId,
        simuladoId: simulado._id,
        respostas,
        acertos,
        totalQuestoes: simulado.questoes.length,
        percentualAcertos,
        tempoGasto
      });
    }

    const resultado = {
      simuladoId: simulado._id,
      titulo: simulado.titulo,
      totalQuestoes: simulado.questoes.length,
      acertos,
      percentualAcertos,
      tempoGasto,
      resultadoDetalhado
    };

    res.json({ resultado });
  } catch (error) {
    console.error('Erro ao submeter respostas:', error);
    res.status(500).json({ message: 'Erro ao submeter respostas' });
  }
};

// Obter histórico de resultados do usuário
export const getHistoricoResultados = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    const resultados = await Resultado.find({ userId })
      .populate('simuladoId', 'titulo')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ resultados });
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({ message: 'Erro ao obter histórico' });
  }
};
