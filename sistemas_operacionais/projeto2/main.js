/** @description 
 * Multiplicação de vetores usando múltiplas threads.
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Função que gera um vetor com números inteiros aleatórios ou sequenciais
function fGeraVetor(size, sequential = false) {
  return Array.from({ length: size }, (_, i) => 
    sequential ? i + 1 : Math.floor(Math.random() * 100)
  );
}

/**
 * Função para multiplicar dois vetores usando múltiplas threads.
 * @param {number[]} arr1 - Primeiro vetor.
 * @param {number[]} arr2 - Segundo vetor.
 * @param {number} numThreads - Número de threads a serem usadas.
 * @returns {Promise<number[]>} - Promessa que resolve para o vetor resultado da multiplicação.
 */
function fMultiplicaVetores(arr1, arr2, numThreads) {
  const size = arr1.length; // Tamanho dos vetores
  const segmentSize = Math.ceil(size / numThreads); // Tamanho de cada segmento para cada thread
  const promises = []; // Array de promessas para aguardar a conclusão dos workers

  console.time('Parallel Multiplication'); // Início da medição de tempo para a multiplicação paralela

  // Cria um worker para cada segmento dos vetores
  for (let i = 0; i < numThreads; i++) {
    const start = i * segmentSize; // Índice de início do segmento
    const end = Math.min(start + segmentSize, size); // Índice de fim do segmento

    promises.push(new Promise((resolve, reject) => {
      // Cria um novo worker, passando os dados dos vetores para ele
      const worker = new Worker(__filename, {
        workerData: { arr1: arr1.slice(start, end), arr2: arr2.slice(start, end) }
      });

      // Configura os eventos do worker
      worker.on('message', resolve); // Resolve a promessa com a mensagem recebida do worker
      worker.on('error', reject); // Rejeita a promessa se ocorrer um erro
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    }));
  }

  // Aguarda a conclusão de todas as promessas e concatena os segmentos dos resultados
  return Promise.all(promises).then((segments) => {
    console.timeEnd('Multiplicação de vetores:'); // Fim da medição de tempo
    return segments.flat(); // Concatena todos os segmentos dos resultados em um único vetor
  });
}

// Código que será executado nas threads paralelas
if (!isMainThread) {
  const { arr1, arr2 } = workerData; // Recebe os dados dos vetores do thread principal
  const resultSegment = []; // Vetor para armazenar o resultado do segmento

  // Simula um pequeno atraso (1ms) a cada cálculo
  for (let i = 0; i < arr1.length; i++) {
    resultSegment[i] = arr1[i] * arr2[i]; // Calcula a multiplicação elemento a elemento
  }

  parentPort.postMessage(resultSegment); // Envia o resultado de volta para o thread principal
}

// Função principal (executada na thread principal)
if (isMainThread) {
  const size = 500; // Tamanho do vetor (mínimo de 500 elementos)
  const numThreads = 2; // Número de threads para dividir o trabalho

  // Gera dois vetores para a multiplicação
  const arr1 = fGeraVetor(size, true); // Vetor 1 com números sequenciais
  const arr2 = fGeraVetor(size, true); // Vetor 2 com números sequenciais

  console.log('Multiplicação usando threads paralelas...');
  
  // Executa a multiplicação paralela e exibe os resultados
  fMultiplicaVetores(arr1, arr2, numThreads).then(result => {
    console.log('Resultado :', result);
  });
}
