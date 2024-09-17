/**
 * ! Projeto 1 (THREADS)
 */

const { Worker, isMainThread, parentPort } = require('worker_threads');
const readline = require('readline');
const { Mutex } = require('async-mutex');
// const { exit } = require('process');  //apenas para fins de debugg

// Inicializa variáveis e configurações
let saldo = 100; // Saldo inicial da conta bancária
const ganhoPercentual = 0.01;  // Percentual de ganho aplicado ao saldo  (1%)
const rendimentoInterval = 10000;  // Intervalo em milissegundos para aplicar o rendimento contínuo
const mutex = new Mutex(); // Cria um mutex para garantir a sincronização entre threads
// EXIT


// Verifica se o código está sendo executado em um worker thread
if (!isMainThread) {
    // Código executado pelo worker thread

    parentPort.on('message', async (message) => {
       
        if (message.action === 'atualizar_saldo') {
            // Atualiza o saldo recebido do thread principal
            saldo = message.saldo;
        }
    });

    setInterval(async () => {
        // Adquire o mutex para garantir acesso exclusivo ao saldo
        const release = await mutex.acquire();
        
        // Atualiza o saldo com o ganho percentual
        saldo += saldo * ganhoPercentual;
        
        // Envia o saldo atualizado ao thread principal
        parentPort.postMessage({ saldo });
        
        // Libera o mutex após a atualização
        release();
    }, rendimentoInterval); // O intervalo de aplicação do rendimento é definido pela variável rendimentoInterval
} else {
    // Código executado pelo thread principal

    // Cria uma interface para leitura e escrita via terminal
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Cria um novo worker thread para aplicar rendimento contínuo
    const worker = new Worker(__filename);

    // Listener para mensagens recebidas do worker thread
    let saldoAtualizado = saldo; // Variável para armazenar o saldo atualizado

    worker.on('message', (message) => {
        saldoAtualizado = message.saldo; // Atualiza o saldo com o valor enviado pelo worker
    });

    // Função para enviar o saldo atualizado ao worker
    const enviarSaldoAoWorker = (saldo) => {
        worker.postMessage({ action: 'atualizar_saldo', saldo });
    };

    // Função para realizar operações com o saldo
    const realizarOperacao = async () => {
        rl.question(`Escolha uma operação:
                                    1. Saque
                                    2. Depósito
                                    3. Visualizar saldo
                                    4. Sair
                                    > `, async (opcao) => {
                                        
                        switch (opcao.trim()) {
                            case '1':
                                rl.question('Informe o valor de saque: ', async (valor) => {
                                    const release = await mutex.acquire();
                                    saldoAtualizado -= parseFloat(valor); // Subtrai o valor do saque do saldo
                                    console.log(`Saque realizado. Saldo atual: ${saldoAtualizado.toFixed(2)}`); // Exibe o saldo atualizado
                                    enviarSaldoAoWorker(saldoAtualizado); // Envia o saldo atualizado ao worker
                                    release(); // Libera o mutex
                                    realizarOperacao(); // Retorna ao menu de operações
                                });
                                break;
                            
                            case '2':
                                rl.question('Informe o valor de depósito: ', async (valor) => {
                                    const release = await mutex.acquire();
                                    saldoAtualizado += parseFloat(valor); // Adiciona o valor do depósito ao saldo
                                    console.log(`Depósito realizado. Saldo atual: ${saldoAtualizado.toFixed(2)}`); // Exibe o saldo atualizado
                                    enviarSaldoAoWorker(saldoAtualizado); // Envia o saldo atualizado ao worker
                                    release(); // Libera o mutex
                                    realizarOperacao(); // Retorna ao menu de operações
                                });
                                break;
                            
                            case '3':
                                const release = await mutex.acquire();
                                console.log(`Saldo atual: ${saldoAtualizado.toFixed(2)}`); // Exibe o saldo atual
                                release(); // Libera o mutex
                                realizarOperacao(); // Retorna ao menu de operações
                                break;
                            
                            case '4':
                                console.log(`Programa encerrado. Saldo final: ${saldoAtualizado.toFixed(2)}`); // Exibe o saldo final
                                worker.terminate(); // Encerra o worker thread
                                rl.close(); // Fecha a interface de readline
                                break;
                            
                            default:
                                console.log('Opção inválida. Tente novamente.'); // Exibe uma mensagem de erro
                                realizarOperacao(); // Retorna ao menu de operações
                                break;
                        }
                    });
                };

    // Inicia a função para exibir o menu de operações e permitir interação do usuário
    realizarOperacao();
}
