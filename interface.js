// interface.js — só cuida da TELA (escolher arquivo, mostrar resultado).
// A verificação em si fica no seu código: veja "PONTO DE CONEXÃO" mais abaixo.

// Avisa o CSS que o JavaScript está funcionando (ativa as animações de entrada)
document.documentElement.classList.add('js');

// ---------- Pegando os elementos da página ----------
const dropzone = document.getElementById('dropzone');
const inputArquivo = document.getElementById('arquivo');
const tituloDz = document.getElementById('dz-titulo');
const botao = document.getElementById('btn-verificar');
const aviso = document.getElementById('aviso');
const secaoResultado = document.getElementById('resultado');
const resumo = document.getElementById('resumo');
const lista = document.getElementById('lista-problemas');

let arquivoEscolhido = null;

// ---------- Escolher o arquivo (clique ou arrastar) ----------
inputArquivo.addEventListener('change', () => receberArquivo(inputArquivo.files[0]));

dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('arrastando'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('arrastando'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('arrastando');
  receberArquivo(e.dataTransfer.files[0]);
});

function receberArquivo(arquivo) {
  aviso.textContent = '';
  if (!arquivo) return;

  // Confere só a extensão; a leitura de verdade é com você
  if (!arquivo.name.toLowerCase().endsWith('.docx')) {
    arquivoEscolhido = null;
    botao.disabled = true;
    aviso.textContent = 'Este arquivo não é .docx. Escolha um documento do Word.';
    return;
  }
  arquivoEscolhido = arquivo;
  tituloDz.textContent = arquivo.name;
  botao.disabled = false;
}

// ---------- Verificar ----------
botao.addEventListener('click', async () => {
  if (!arquivoEscolhido) return;
  botao.disabled = true;
  aviso.textContent = 'Verificando...';

  try {
    let resultado;

    // ===== PONTO DE CONEXÃO =====
    // Quando você criar a função global verificarDocumento(arquivo), ela será usada aqui.
    //   Recebe:  um objeto File (o .docx escolhido)
    //   Devolve: { regrasVerificadas: número,
    //              problemas: [ { regra, norma, gravidade, mensagem, detalhe } ] }
    //   - regra:     código curto, ex.: "FONTE-01"
    //   - norma:     número da norma, ex.: "NBR 14724"
    //   - gravidade: "erro" ou "aviso"
    //   - mensagem:  o que está errado, em uma frase
    //   - detalhe:   (opcional) esperado x encontrado
    // Enquanto ela não existir, a tela mostra um resultado de DEMONSTRAÇÃO.
    if (typeof window.verificarDocumento === 'function') {
      resultado = await window.verificarDocumento(arquivoEscolhido);
      aviso.textContent = '';
    } else {
      resultado = resultadoDemonstracao();
      aviso.textContent = 'Modo demonstração: estes dados são de exemplo, ainda não vêm do seu verificador.';
    }

    mostrarResultado(resultado);
  } catch (erro) {
    console.error(erro);
    aviso.textContent = 'Não foi possível ler o arquivo. Confira se ele não está corrompido e tente de novo.';
  } finally {
    botao.disabled = false;
  }
});

// ---------- Mostrar o relatório ----------
function mostrarResultado({ regrasVerificadas, problemas }) {
  lista.replaceChildren(); // limpa o resultado anterior

  const erros = problemas.filter((p) => p.gravidade === 'erro').length;
  const avisos = problemas.length - erros;
  resumo.textContent = problemas.length === 0
    ? `${regrasVerificadas} regras verificadas. Nenhum problema encontrado.`
    : `${regrasVerificadas} regras verificadas: ${erros} erro(s) e ${avisos} aviso(s).`;

  for (const p of problemas) {
    const item = document.createElement('li');
    item.className = 'problema';

    const topo = document.createElement('div');
    topo.className = 'problema-topo';

    const etiqueta = document.createElement('span');
    etiqueta.className = 'tag ' + (p.gravidade === 'erro' ? 'tag-vermelho' : 'tag-amarelo');
    etiqueta.textContent = p.gravidade;

    const codigo = document.createElement('span');
    codigo.className = 'problema-regra';
    codigo.textContent = `${p.regra} · ${p.norma}`;
    topo.append(etiqueta, codigo);

    const msg = document.createElement('p');
    msg.className = 'problema-msg';
    msg.textContent = p.mensagem;
    item.append(topo, msg);

    if (p.detalhe) {
      const det = document.createElement('p');
      det.className = 'problema-detalhe';
      det.textContent = p.detalhe;
      item.append(det);
    }
    lista.append(item);
  }

  // textContent (e não innerHTML) evita que texto vindo do documento vire código na página
  secaoResultado.hidden = false;
  secaoResultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Dados de exemplo, só para você ver como o relatório fica. Apague quando o seu verificador existir.
function resultadoDemonstracao() {
  return {
    regrasVerificadas: 5,
    problemas: [
      { regra: 'FONTE-02', norma: 'NBR 14724', gravidade: 'erro', mensagem: 'O corpo do texto usa tamanho de fonte diferente do esperado.', detalhe: 'Esperado: 12 pt. Encontrado: 11 pt.' },
      { regra: 'MARGEM-01', norma: 'NBR 14724', gravidade: 'aviso', mensagem: 'A margem esquerda está menor que o padrão.', detalhe: 'Esperado: 3 cm. Encontrado: 2,5 cm.' },
    ],
  };
}

// ---------- Entrada suave das seções (só se a pessoa não pediu menos movimento) ----------
const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const alvos = document.querySelectorAll('.reveal');
if (reduzMovimento || !('IntersectionObserver' in window)) {
  alvos.forEach((el) => el.classList.add('visivel'));
} else {
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visivel'); observador.unobserve(e.target); } });
  }, { threshold: 0.1 });
  alvos.forEach((el) => observador.observe(el));
}
