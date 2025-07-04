import bcrypt from 'bcryptjs';

bcrypt.hash('senha123', 10).then((hash) => {
  console.log('HASH GERADO:', hash);
});
