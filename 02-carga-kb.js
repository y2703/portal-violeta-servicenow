/* ============================================================
   Portal Violeta — 02. Carga da base de conhecimento
   ------------------------------------------------------------
   Cria a base "Ajuda Violeta" e os artigos publicados que
   alimentam o FAQ da home e a pagina vp_kb.

   Artigos sao DADOS, nao configuracao: por isso nao viajam
   dentro das Update Sets e precisam deste script.

   Rode em: System Definition > Scripts - Background (Global)
   Idempotente: rodar de novo nao duplica artigos.
   ============================================================ */

var NOME_BASE = 'Ajuda Violeta';

/* ---------- 1. Base de conhecimento ---------- */
var idBase = '';
var kb = new GlideRecord('kb_knowledge_base');
kb.addQuery('title', NOME_BASE);
kb.query();

if (kb.next()) {
  idBase = kb.getUniqueValue();
  gs.info('[VIOLETA] Base ja existe: ' + idBase);
} else {
  kb.initialize();
  kb.title = NOME_BASE;
  kb.description = 'Central de ajuda do Portal Violeta';
  kb.active = true;
  idBase = kb.insert();
  gs.info('[VIOLETA] Base criada: ' + idBase);
}

/* ---------- 2. Artigos ---------- */
var ARTIGOS = [
  {
    titulo: 'Meu cartao foi bloqueado. O que faco?',
    texto: '<p>O bloqueio acontece por seguranca quando identificamos uma compra fora do seu padrao.</p>' +
           '<p>Para desbloquear, abra a solicitacao <b>Desbloquear cartao</b> na categoria Cartao. ' +
           'Confirme os quatro ultimos digitos e o desbloqueio sai em minutos.</p>' +
           '<p>Se voce nao reconhece a compra que causou o bloqueio, use <b>Contestar compra</b> ' +
           'em vez de desbloquear.</p>'
  },
  {
    titulo: 'Como pedir a segunda via do cartao',
    texto: '<p>Abra <b>Solicitar 2a via</b> na categoria Cartao.</p>' +
           '<p>Informe os quatro ultimos digitos do cartao atual e confirme o endereco de entrega. ' +
           'O CEP preenche o restante do endereco automaticamente.</p>' +
           '<p>O prazo de entrega e de ate sete dias uteis. O cartao anterior e cancelado ' +
           'assim que o novo for desbloqueado.</p>'
  },
  {
    titulo: 'O Pix nao caiu na conta de destino',
    texto: '<p>Pix costuma levar segundos, mas pode atrasar quando a instituicao de destino ' +
           'esta em manutencao.</p>' +
           '<p>Antes de abrir uma solicitacao, confira o comprovante: se ele mostra ' +
           '<b>concluido</b>, o valor saiu daqui e o atraso e do outro banco.</p>' +
           '<p>Se passaram mais de 30 minutos, abra <b>Devolucao de Pix</b> na categoria Conta e Pix ' +
           'e anexe o comprovante.</p>'
  },
  {
    titulo: 'Como aumentar o limite do cartao',
    texto: '<p>Abra <b>Aumentar limite</b> na categoria Credito e informe o valor desejado.</p>' +
           '<p>Pedidos ate R$ 10.000 sao avaliados automaticamente. Acima desse valor, ' +
           'a solicitacao passa por analise manual e voce acompanha o andamento pelo portal.</p>' +
           '<p>Se o pedido nao for aprovado, voce pode tentar novamente em 30 dias.</p>'
  },
  {
    titulo: 'Nao reconheco uma compra na fatura',
    texto: '<p>Abra <b>Contestar compra</b> na categoria Seguranca.</p>' +
           '<p>Informe a data, o valor e o nome do estabelecimento como aparece na fatura. ' +
           'Quanto mais detalhe, mais rapida a analise.</p>' +
           '<p>Enquanto a contestacao esta em analise, o valor fica suspenso e nao entra ' +
           'no calculo da fatura.</p>'
  },
  {
    titulo: 'Vou viajar. Preciso avisar?',
    texto: '<p>Sim, e o aviso evita bloqueios por compra fora do seu padrao.</p>' +
           '<p>Abra <b>Avisar viagem</b> na categoria Cartao informando destino e periodo. ' +
           'Vale tanto para viagens nacionais quanto internacionais.</p>' +
           '<p>O aviso vale ate a data final informada e pode ser aberto no mesmo dia da viagem.</p>'
  }
];

var criados = 0, existentes = 0;

for (var i = 0; i < ARTIGOS.length; i++) {
  var art = ARTIGOS[i];

  var existe = new GlideRecord('kb_knowledge');
  existe.addQuery('short_description', art.titulo);
  existe.addQuery('kb_knowledge_base', idBase);
  existe.query();

  if (existe.next()) {
    existentes++;
    continue;
  }

  var novo = new GlideRecord('kb_knowledge');
  novo.initialize();
  novo.short_description = art.titulo;
  novo.text = art.texto;
  novo.kb_knowledge_base = idBase;
  novo.workflow_state = 'published';
  novo.active = true;
  novo.insert();
  criados++;
}

gs.info('[VIOLETA] ---------------------------------------');
gs.info('[VIOLETA] Artigos criados: ' + criados);
gs.info('[VIOLETA] Ja existiam: ' + existentes);
gs.info('[VIOLETA] Carga concluida. Acesse /vp.');
