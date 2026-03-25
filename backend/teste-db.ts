import { TransacaoService } from './src/services/TransacaoService';
import { CaixaService } from './src/services/CaixaService';
import { ClienteService } from './src/services/ClienteService';

async function testar() {
  try {
    console.log("=== TESTANDO CLIENTES ===");
    const clienteS = new ClienteService();
    const clientes = await clienteS.listAll();
    console.log("Clientes passou!", clientes.length);

    console.log("=== TESTANDO TRANSACAO ===");
    const transacaoS = new TransacaoService();
    const transacoes = await transacaoS.listAll();
    console.log("Transacoes passou!", transacoes.length);

    console.log("=== TESTANDO CAIXA ===");
    const caixaS = new CaixaService();
    const data = new Date().toISOString().split('T')[0];
    const caixa = await caixaS.resumoDiario(data);
    console.log("Caixa passou!");
  } catch (err) {
    console.error("💥 ERRO DETECTADO:", err);
  }
}

testar();
