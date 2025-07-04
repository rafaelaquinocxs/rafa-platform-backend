import mongoose from 'mongoose';

const questaoSchema = new mongoose.Schema({
  texto: { type: String, required: true },
  opcoes: [{ type: String, required: true }],
  respostaCorreta: { type: Number, required: true },
  materia: { type: String, required: true },
  explicacao: { type: String, required: true }
});

const simuladoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descricao: { type: String },
  materias: [{ type: String, required: true }],
  questoes: [questaoSchema],
  tempoDuracao: { type: Number, required: true }, // em segundos
  ativo: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Simulado', simuladoSchema);

