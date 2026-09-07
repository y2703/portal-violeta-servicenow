/* ============================================================
   Portal Violeta — 01. Complementos de backend
   ------------------------------------------------------------
   Cria o que NAO viaja dentro das Update Sets deste repositorio:
     - campo u_analise_manual na tabela sc_req_item
     - Script Include VioletaCEP (integracao com a API ViaCEP)
     - Business Rule "Violeta - Define analise manual"

   Rode em: System Definition > Scripts - Background (escopo Global)
   Depois de importar e comitar as tres Update Sets.
   O script e idempotente: rodar duas vezes nao duplica nada.
   ============================================================ */

/* ---------- 1. Campo u_analise_manual em sc_req_item ---------- */
(function criarCampo() {
  var dic = new GlideRecord('sys_dictionary');
  dic.addQuery('name', 'sc_req_item');
  dic.addQuery('element', 'u_analise_manual');
  dic.query();
  if (dic.next()) {
    gs.info('[VIOLETA] Campo u_analise_manual ja existe.');
    return;
  }
  dic.initialize();
  dic.name = 'sc_req_item';
  dic.element = 'u_analise_manual';
  dic.column_label = 'Analise manual';
  dic.internal_type = 'boolean';
  dic.default_value = 'false';
  dic.active = true;
  dic.insert();
  gs.info('[VIOLETA] Campo u_analise_manual criado.');
})();

/* ---------- 2. Script Include VioletaCEP ---------- */
(function criarScriptInclude() {
  var si = new GlideRecord('sys_script_include');
  si.addQuery('name', 'VioletaCEP');
  si.query();
  if (si.next()) {
    gs.info('[VIOLETA] Script Include VioletaCEP ja existe.');
    return;
  }

  var corpo = [
    'var VioletaCEP = Class.create();',
    'VioletaCEP.prototype = Object.extendsObject(AbstractAjaxProcessor, {',
    '',
    '    /* Chamado pelo Catalog Client Script via GlideAjax.',
    '       Recebe sysparm_cep e devolve JSON com o endereco. */',
    '    buscar: function () {',
    '        var cep = String(this.getParameter("sysparm_cep") || "").replace(/\\D/g, "");',
    '',
    '        if (cep.length !== 8) {',
    '            return JSON.stringify({ erro: true, mensagem: "CEP invalido" });',
    '        }',
    '',
    '        try {',
    '            var req = new sn_ws.RESTMessageV2();',
    '            req.setHttpMethod("GET");',
    '            req.setEndpoint("https://viacep.com.br/ws/" + cep + "/json/");',
    '            req.setHttpTimeout(5000);',
    '',
    '            var resp = req.execute();',
    '            var status = resp.getStatusCode();',
    '',
    '            if (status != 200) {',
    '                return JSON.stringify({ erro: true, mensagem: "Servico de CEP indisponivel" });',
    '            }',
    '',
    '            var dados = JSON.parse(resp.getBody());',
    '',
    '            if (dados.erro) {',
    '                return JSON.stringify({ erro: true, mensagem: "CEP nao encontrado" });',
    '            }',
    '',
    '            return JSON.stringify({',
    '                erro: false,',
    '                rua: dados.logradouro || "",',
    '                bairro: dados.bairro || "",',
    '                cidade: dados.localidade || "",',
    '                uf: dados.uf || ""',
    '            });',
    '',
    '        } catch (e) {',
    '            gs.error("[VioletaCEP] " + e.message);',
    '            return JSON.stringify({ erro: true, mensagem: "Falha ao consultar o CEP" });',
    '        }',
    '    },',
    '',
    '    type: "VioletaCEP"',
    '});'
  ].join('\n');

  si.initialize();
  si.name = 'VioletaCEP';
  si.api_name = 'global.VioletaCEP';
  si.client_callable = true;
  si.active = true;
  si.access = 'public';
  si.description = 'Consulta a API publica ViaCEP e devolve o endereco para o Catalog Client Script.';
  si.script = corpo;
  si.insert();
  gs.info('[VIOLETA] Script Include VioletaCEP criado.');
})();

/* ---------- 3. Business Rule de analise manual ---------- */
(function criarBusinessRule() {
  var br = new GlideRecord('sys_script');
  br.addQuery('name', 'Violeta - Define analise manual');
  br.query();
  if (br.next()) {
    gs.info('[VIOLETA] Business Rule ja existe.');
    return;
  }

  var corpo = [
    '(function executeRule(current, previous /*null when async*/) {',
    '',
    '    /* Só interessa o item "Aumentar limite".',
    '       O titulo e um campo traduzido: use getDisplayValue(). */',
    '    var nomeItem = String(current.cat_item.getDisplayValue() || "").trim();',
    '    if (nomeItem !== "Aumentar limite") return;',
    '',
    '    /* A variavel chega como texto formatado: "R$ 15.000,00" */',
    '    var texto = String(current.variables.limite_desejado || "").trim();',
    '    if (!texto) return;',
    '',
    '    var limpo = texto.replace(/[^0-9,.]/g, "")   // tira "R$" e espacos',
    '                     .replace(/\\./g, "")          // tira separador de milhar',
    '                     .replace(",", ".");           // virgem decimal -> ponto',
    '',
    '    var valor = parseFloat(limpo);',
    '    if (isNaN(valor)) return;',
    '',
    '    /* Grava em campo REAL. O Flow le esse campo com Look Up Record,',
    '       porque o gatilho do catalogo dispara antes das variaveis',
    '       serem commitadas e leria sempre o valor padrao. */',
    '    current.u_analise_manual = (valor > 10000);',
    '',
    '})(current, previous);'
  ].join('\n');

  br.initialize();
  br.name = 'Violeta - Define analise manual';
  br.collection = 'sc_req_item';
  br.when = 'before';
  br.action_insert = true;
  br.action_update = false;
  br.order = 100;
  br.active = true;
  br.script = corpo;
  br.insert();
  gs.info('[VIOLETA] Business Rule criada.');
})();

gs.info('[VIOLETA] Complementos concluidos. Rode agora o 02-carga-kb.js.');
