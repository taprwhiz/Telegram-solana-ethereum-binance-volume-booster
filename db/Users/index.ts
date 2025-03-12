import mongoose from "mongoose";

const Users = new mongoose.Schema({
  id: { type: String, require: true },
  chain: { type: String, require: true },
  wallets: {
    ether: { type: Object, require: false },
    solana: { type: Object, require: false },
  },
  ethereum: {
    mode: { type: String, require: true },
    amount: { type: Number, require: true },
    isBundling: { type: Boolean, required: true },
    token: { type: String, require: false },
    fee: { type: Number, require: true },
    receiver: { type: String, require: false },
    time: { type: Number, require: false },
    withdrawAmount: { type: String, require: false },
  },
  solana: {
    amount: [{ type: Number, require: true }],
    token: { type: String, require: false },
    pool: { type: String, require: false },
    receiver: { type: String, require: false },
    dexType: { type: String, require: false },
    speed: { type: Number, require: false },
    time: { type: Number, require: false },
    holderVersion: { type: Boolean, default: false },
    label: { type: String, require: false }
  },
  base: {},
  isBoosting: {
    ether: { type: Boolean, default: false },
    solana: { type: Boolean, default: false },
  },
  isWorking: {
    ether: { type: Boolean, default: false },
    solana: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: new Date(new Date().toUTCString()) },
});

const UsersModal = mongoose.model("Users", Users);

export default UsersModal;
