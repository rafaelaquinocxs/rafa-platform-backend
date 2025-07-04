import mongoose from 'mongoose';

const resultadoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  simuladoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulado', required: true },
  respostas: [{
    questaoId: { type: String, required: true },
    resposta: { type: Number, required: true }
  }],
  acertos: { type: Number, required: true },
  totalQuestoes: { type: Number, required: true },
  percentualAcertos: { type: Number, required: true },
  tempoGasto: { type: Number, required: true }, // em segundos
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Resultado', resultadoSchema);

