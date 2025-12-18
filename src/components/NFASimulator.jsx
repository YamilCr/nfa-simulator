import React, { useState } from "react";
import { Play, RotateCcw, CheckCircle, XCircle, AlertCircle } from "lucide-react";


const NFASimulator = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [trace, setTrace] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Definición del NFA
  const Q = ['q0', 'qNeg', 'qIntL', 'qIntF', 'qF', 'qT', 'qC', 'qA', 'qS', 'qNeu', 'qBut', 'qSink', 'qIntF_Neg', 'qEnd'];
  const F = ['qF', 'qT', 'qC', 'qA', 'qS', 'qNeu', 'qEnd'];
  
  const stateLabels = {
    q0: 'Inicio',
    qNeg: 'Negación',
    qIntL: 'Int. Leve',
    qIntF: 'Int. Fuerte',
    qF: 'Feliz',
    qT: 'Triste',
    qC: 'Cansado',
    qA: 'Ansiedad',
    qS: 'Sorpresa',
    qNeu: 'Neutral',
    qBut: 'Adversativo',
    qSink: 'Sumidero',
    qIntF_Neg: 'Neg+Int',
    qEnd: 'Final'
  };

  // Tabla de transiciones simplificada
const transitions = {
  q0: {
    'feliz': ['qF'],
    'aprobado': ['qF'],
    'triste': ['qT'],
    'cansado': ['qC'],
    'ansioso': ['qA'],
    'sorprendido': ['qS'],
    'no': ['qNeg'],
    'nunca': ['qNeg'],
    'muy': ['qIntF'],
    're': ['qIntF'],
    'demasiado': ['qIntF'],
    'poco': ['qIntL'],
    'algo': ['qIntL'],
    'un poco': ['qIntL'],
    'estoy': ['qNeu'],
    'hoy': ['qNeu'],
    'yo': ['qNeu'],
    'hola': ['qNeu'],
    'pero': ['qBut'],
    'aunque': ['qBut'],
    'me gusta': ['qF'],
    'epsilon': ['qSink']
  },

  qNeg: {
    'feliz': ['qT'],
    'triste': ['qF'],
    'cansado': ['qF'],
    'ansioso': ['qF'],
    'muy': ['qIntF_Neg'],
    're': ['qIntF_Neg'],
    'estoy': ['qNeu']
  },

  qIntF: {
    'feliz': ['qF', 'qIntF'],
    'triste': ['qT', 'qIntF'],
    'cansado': ['qC', 'qIntF'],
    'ansioso': ['qA', 'qIntF'],
    'sorprendido': ['qS', 'qIntF'],
    'pero': ['qBut']
  },

  qIntL: {
    'feliz': ['qF', 'qIntL'],
    'triste': ['qT', 'qIntL'],
    'cansado': ['qC', 'qIntL'],
    'ansioso': ['qA', 'qIntL']
  },

  qIntF_Neg: {
    'feliz': ['qT'],
    'triste': ['qF'],
    'cansado': ['qF']
  },

  qNeu: {
    'feliz': ['qF'],
    'triste': ['qT'],
    'cansado': ['qC'],
    'ansioso': ['qA'],
    'sorprendido': ['qS'],
    'muy': ['qIntF'],
    'poco': ['qIntL'],
    'y': ['qNeu'],
    'estoy': ['qNeu'],
    'hoy': ['qNeu']
  },

  qBut: {
    'epsilon': ['q0'],
    'feliz': ['qF'],
    'triste': ['qT'],
    'cansado': ['qC'],
    'ansioso': ['qA'],
    'sorprendido': ['qS'],
    'muy': ['qIntF'],
    'un poco': ['qIntL']
  },

  qF: {
    'y': ['qNeu'],
    'pero': ['qBut'],
    'epsilon': ['qEnd']
  },

  qT: {
    'y': ['qNeu'],
    'pero': ['qBut'],
    'epsilon': ['qEnd']
  },

  qC: {
    'y': ['qNeu'],
    'pero': ['qBut'],
    'epsilon': ['qEnd']
  },

  qA: {
    'y': ['qNeu'],
    'epsilon': ['qEnd']
  },

  qS: {
    'y': ['qNeu'],
    'epsilon': ['qEnd']
  },

  qEnd: {
    'este': ['qEnd'],
    'día': ['qEnd'],
    'dia': ['qEnd']
  },

  qSink: {}
};

  // Tokenizar entrada
  const tokenize = (text) => {
    text = text.toLowerCase().trim();
    const tokens = [];
    let i = 0;
    
    while (i < text.length) {
      // Saltar espacios
      while (i < text.length && text[i] === ' ') i++;
      if (i >= text.length) break;
      
      // Intentar frases multi-palabra
      let matched = false;
      for (const phrase of ['me gusta', 'un poco', 'sin embargo']) {
        if (text.substr(i, phrase.length) === phrase) {
          tokens.push(phrase);
          i += phrase.length;
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        // Palabra simple
        let j = i;
        while (j < text.length && text[j] !== ' ') j++;
        tokens.push(text.substring(i, j));
        i = j;
      }
    }
    
    return tokens;
  };

  // Simulación del NFA
  const simulateNFA = (tokens) => {
    let currentStates = new Set(['q0']);
    const executionTrace = [];
    
    // Aplicar epsilon-clausura inicial
    currentStates = epsilonClosure(currentStates);
    executionTrace.push({
      step: 0,
      token: '(inicio)',
      states: Array.from(currentStates),
      interpretation: 'Estado inicial'
    });

    // Procesar cada token
    tokens.forEach((token, idx) => {
      const nextStates = new Set();
      
      currentStates.forEach(state => {
        if (transitions[state] && transitions[state][token]) {
          transitions[state][token].forEach(nextState => {
            nextStates.add(nextState);
          });
        }
      });
      
      // Aplicar epsilon-clausura
      currentStates = epsilonClosure(nextStates);
      
      executionTrace.push({
        step: idx + 1,
        token: token,
        states: Array.from(currentStates),
        interpretation: interpretStates(currentStates, executionTrace)
      });
    });

    // Epsilon-clausura final
    currentStates = epsilonClosure(currentStates);
    
    // Verificar aceptación
    const finalStates = Array.from(currentStates);
    const accepted = finalStates.some(state => F.includes(state));
    
    return {
      accepted,
      finalStates,
      trace: executionTrace,
      interpretation: interpretStates(currentStates, executionTrace)
    };
  };

  // Epsilon-clausura
  const epsilonClosure = (states) => {
    const closure = new Set(states);
    const stack = Array.from(states);
    
    while (stack.length > 0) {
      const state = stack.pop();
      if (transitions[state] && transitions[state]['epsilon']) {
        transitions[state]['epsilon'].forEach(nextState => {
          if (!closure.has(nextState)) {
            closure.add(nextState);
            stack.push(nextState);
          }
        });
      }
    }
    
    return closure;
  };

  // Interpretar estados finales
const interpretStates = (states, trace = []) => {
  const stateArray = Array.from(states);
  const emotions = [];
  let intensity = 'normal';
  let negation = false;

  const processStates = (arr) => {
    arr.forEach(state => {
      if (state === 'qF') emotions.push('Felicidad');
      if (state === 'qT') emotions.push('Tristeza');
      if (state === 'qC') emotions.push('Cansancio');
      if (state === 'qA') emotions.push('Ansiedad');
      if (state === 'qS') emotions.push('Sorpresa');
      if (state === 'qNeu') emotions.push('Neutral');
      if (state === 'qIntF') intensity = 'ALTA';
      if (state === 'qIntL') intensity = 'LEVE';
      if (state === 'qNeg') negation = true;
    });
  };

  // 1. Estados actuales
  processStates(stateArray);

  // 2. Si no hay emoción, busco en la traza hacia atrás
  if (emotions.length === 0) {
    for (let i = trace.length - 1; i >= 0; i--) {
      processStates(Array.from(trace[i].states));
      if (emotions.length > 0) break;
    }
  }

  if (emotions.length === 0) return 'Sin emoción detectada';

  let result = emotions.join(' + ');
  if (intensity !== 'normal') result += ` (intensidad ${intensity})`;
  if (negation) result += ' [con negación activa]';

  return result;
};

  // Ejecutar simulación
  const runSimulation = () => {
    if (!input.trim()) {
      setResult({ error: 'Por favor ingresa una frase' });
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const tokens = tokenize(input);
      const simulationResult = simulateNFA(tokens);
      
      setResult(simulationResult);
      setTrace(simulationResult.trace);
      setIsProcessing(false);
    }, 300);
  };

  // Reiniciar
  const reset = () => {
    setInput('');
    setResult(null);
    setTrace([]);
  };

  // Ejemplos predefinidos
  const examples = [
    'muy feliz',
    'no triste',
    'no muy feliz',
    'triste pero feliz',
    'estoy muy cansado pero un poco feliz',
    'me gusta este dia'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🤖 Simulador NFA - Detector de Emociones
          </h1>
          <p className="text-gray-600">
            Implementación web del Autómata Finito No Determinista
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ingresa una frase para analizar:
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && runSimulation()}
              placeholder='Ejemplo: "no estoy muy feliz pero un poco esperanzado"'
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={runSimulation}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              Ejecutar
            </button>
            <button
              onClick={reset}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Limpiar
            </button>
          </div>

          {/* Ejemplos */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Ejemplos rápidos:</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(ex)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result Section */}
        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              {result.accepted ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <h2 className="text-xl font-bold text-green-700">✓ ACEPTADO</h2>
                    <p className="text-gray-600">Cadena válida en el lenguaje</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <h2 className="text-xl font-bold text-red-700">✗ RECHAZADO</h2>
                    <p className="text-gray-600">Cadena no válida</p>
                  </div>
                </>
              )}
            </div>

            {/* Estados Finales */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Estados Finales Activos:</h3>
              <div className="flex flex-wrap gap-2">
                {result.finalStates.map((state, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      F.includes(state)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {state} - {stateLabels[state]}
                  </span>
                ))}
              </div>
            </div>

            {/* Interpretación */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Interpretación Semántica:
              </h3>
              <p className="text-blue-800 text-lg">{result.interpretation}</p>
            </div>
          </div>
        )}

        {/* Trace Section */}
        {trace.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📋 Traza de Ejecución Paso a Paso
            </h2>
            <div className="space-y-3">
              {trace.map((step, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-700">Token:</span>
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md font-mono">
                          {step.token}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold text-gray-700">Estados activos: </span>
                        <span className="text-gray-600">
                          {step.states.map(s => `${s} (${stateLabels[s]})`).join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Interpretación: </span>
                        <span className="text-gray-600">{step.interpretation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 className="font-bold text-gray-800 mb-3">ℹ️ Información del Autómata</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Total de estados:</span> {Q.length}
            </div>
            <div>
              <span className="font-semibold">Estados finales:</span> {F.length}
            </div>
            <div>
              <span className="font-semibold">Tipo:</span> NFA con ε-transiciones
            </div>
            <div>
              <span className="font-semibold">Complejidad:</span> O(n·|Q|²)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFASimulator;