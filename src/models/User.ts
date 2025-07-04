import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  nome: string;
  name: string; // Alias para compatibilidade
  email: string;
  senha: string;
  role: string;
  createdAt: Date;
}

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Virtual para compatibilidade com 'name'
userSchema.virtual('name').get(function() {
  return this.nome;
});

userSchema.virtual('name').set(function(value: string) {
  this.nome = value;
});

// Configurar virtuals no JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export default mongoose.model<IUser>('User', userSchema);
