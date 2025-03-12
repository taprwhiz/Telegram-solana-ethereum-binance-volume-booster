import mongoose from 'mongoose';

const Wallets = new mongoose.Schema({
  userId: { type: String, require: true },
  publicKey: { type: String, require: true },
  privateKey: { type: String, require: true },
  mnemonic: { type: String, require: true },
  chain: { type: String, require: true },
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: new Date(new Date().toUTCString()) },
});

const WalletsModal = mongoose.model('Wallets', Wallets);

export default WalletsModal;
