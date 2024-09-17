const { performance } = require('perf_hooks');

/**@description
 *  Node.js, por padrão, utiliza um único thread para executar código JavaScript (o Event Loop). 
 * A menos que você explicitamente crie múltiplas threads (como com a biblioteca worker_threads), 
 * o código roda inteiramente na thread principal.
 */

// Função para multiplicar dois vetores usando a thread principal
function fMultiplicaVetores(v1, v2) {
  const result = new Array(v1.length);
  for (let i = 0; i < v1.length; i++) {
    result[i] = v1[i] * v2[i];985
  }
  return result;
}

// Função para gerar um vetor de números aleatórios
function fGeraVetor(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 100));
}

// Medição de tempo
const vectorSize = 500;
const vector1 = fGeraVetor(vectorSize);
const vector2 = fGeraVetor(vectorSize);

const startTime = performance.now();
const result = fMultiplicaVetores(vector1, vector2);
const endTime = performance.now();

console.log('vetor1:')
console.dir(vector1, { maxArrayLength: null }); // Exibe todo o array
console.log('--------------------------------------------------------');
console.log('vetor2:')
console.dir(vector2, { maxArrayLength: null });
console.log('--------------------------------------------------------');
console.log('result:')

console.dir(result, { maxArrayLength: null });
console.log('--------------------------------------------------------');


console.log(`Tempo (thread principal): ${endTime - startTime}ms`);
