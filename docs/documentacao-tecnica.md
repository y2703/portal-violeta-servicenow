# Portal Violeta

**Service Portal customizado — ServiceNow**

Documentação técnica do projeto

Yago Dresler — ServiceNow Developer · Setembro de 2026

> **Marca fictícia**
>
> Violeta é uma marca criada exclusivamente para este projeto de portfólio. Nenhuma instituição financeira real está representada neste documento ou no portal.

---

## 1. Visão geral

Portal de autoatendimento de um banco digital fictício, construído do zero sobre o Service Portal do ServiceNow em uma instância PDI. O objetivo foi provar que é possível entregar uma experiência de banco digital — visual próprio, jornada completa do cliente e automação de backend — sem utilizar nenhuma tela de fábrica da plataforma.

A regra imposta ao projeto foi simples: nenhuma tela padrão. Cabeçalho, home, catálogo, confirmação, base de conhecimento, aprovações, painel do atendente e até a página de erro 404 foram construídos em widgets próprios.

| **Item**   | **Valor**                                                                   |
|------------|-----------------------------------------------------------------------------|
| Plataforma | ServiceNow (PDI — Personal Developer Instance)                              |
| Módulo     | Service Portal — endereço /vp                                               |
| Frontend   | AngularJS, HTML, SCSS                                                       |
| Backend    | Server scripts (GlideRecord, GlideAggregate), Script Include, Business Rule |
| Automação  | Flow Designer, Notification                                                 |
| Integração | ViaCEP via sn_ws.RESTMessageV2                                              |
| Idioma     | Português (pt-BR)                                                           |
| Entrega    | Update Sets exportáveis em XML (v3 e v4)                                    |

## 2. Arquitetura

### 2.1 Registros de topo

- Portal: Violeta — endereço /vp, homepage vp_index.

- Tema: Violeta Theme — o campo CSS variables contém apenas variáveis ($violeta-900 até \$brand-color). Regras CSS nesse campo quebram a compilação do tema.

- Cabeçalho e rodapé: Violeta Header e Violeta Footer, ambos na tabela sp_header_footer — e não em sp_widget. Widgets criados na tabela errada simplesmente não aparecem na lista de escolha do tema.

### 2.2 Páginas

| **ID da página**                                 | **Função**                                          |
|--------------------------------------------------|-----------------------------------------------------|
| vp_index                                         | Home: hero, categorias, solicitações recentes e FAQ |
| vp_category                                      | Lista de itens de uma categoria                     |
| vp_cat_item                                      | Formulário do item de catálogo                      |
| vp_confirmacao                                   | Confirmação após o envio                            |
| vp_requests                                      | Minhas solicitações                                 |
| vp_ticket                                        | Detalhe da solicitação                              |
| vp_kb / vp_kb_article                            | Base de conhecimento e artigo                       |
| vp_aprovacoes                                    | Fila de aprovações                                  |
| vp_painel                                        | Painel do atendente com indicadores                 |
| vp_sobre, vp_seguranca, vp_contato, vp_carreiras | Páginas institucionais                              |
| vp_design                                        | Design system: cores, tipografia e componentes      |
| vp_404                                           | Página não encontrada                               |

### 2.3 Widgets

Todos os widgets seguem o prefixo Violeta e utilizam os quatro campos do Service Portal: Body HTML template, CSS - SCSS, Server script e Client controller.

Violeta Hero, Violeta Categorias, Violeta Categoria, Violeta Item, Violeta Solicitacoes, Violeta Requests, Violeta Ticket, Violeta FAQ, Violeta KB, Violeta KB Artigo, Violeta Confirmacao, Violeta Aprovacoes, Violeta Painel, Violeta 404, Violeta Sobre, Violeta Seguranca, Violeta Contato, Violeta Carreiras e Violeta Design.

## 3. Funcionalidades de backend

### 3.1 Integração com a API ViaCEP

O Script Include VioletaCEP — client-callable, estendendo AbstractAjaxProcessor — consome a API pública ViaCEP por meio de sn_ws.RESTMessageV2. O Catalog Client Script "Violeta - Preenche endereço pelo CEP" chama o Script Include via GlideAjax e preenche logradouro, bairro, cidade e UF automaticamente enquanto o cliente digita.

### 3.2 Regra de aprovação — Business Rule e Flow Designer

Regra de negócio: solicitações de aumento de limite acima de R$ 10.000 exigem aprovação do gestor.

A primeira abordagem foi ler a variável do catálogo dentro do próprio Flow. Isso não funciona: o gatilho Service Catalog dispara antes das variáveis serem gravadas, então o Flow lia sempre o valor padrão. Um Timer de dez segundos também não resolveu de forma confiável — funcionava às vezes, e "às vezes" não é solução.

Solução adotada, em duas partes:

1.  Business Rule "Violeta - Define análise manual" (before insert, tabela sc_req_item, ordem 100) lê current.variables.limite_desejado, normaliza o texto — de "R$ 15.000,00" para 15000 — e grava o resultado no campo real u_analise_manual.

2.  O Flow "Violeta - Aumentar limite" usa um Look Up Record sobre esse campo real e ramifica em If / Else.

> **Armadilha do Flow Designer**
>
> Um If aninhado dentro do ramo "então" de outro If nunca é avaliado quando o primeiro é falso. O ramo de rejeição precisa ser um Else no mesmo nível de indentação — não um segundo If lá dentro.

### 3.3 Notificação

Registro sysevent_email_action "Violeta - Solicitação encerrada", com destinatário definido por dot-walking no campo recipient_fields e force_delivery ativo.

## 4. Frontend e experiência

- Micro-interações: elevação e transição suave em cards, categorias e botões ao passar o mouse.

- Botão de chat com efeito 3D: inclinação por transform: perspective(...) rotateX/rotateY acompanhando a posição do cursor.

- Assistente "Vi": avatar em SVG animado dentro do widget de chat.

- Modo escuro: alternância no cabeçalho, com a preferência gravada em localStorage e restaurada a cada visita.

- Scroll reveal: os blocos entram com fade e deslocamento de 16px conforme a rolagem, via IntersectionObserver, respeitando prefers-reduced-motion.

- Design system: a página vp_design documenta paleta, tipografia e componentes do portal.

## 5. Como restaurar em outra instância

3.  Acesse Retrieved Update Sets e use Import Update Set from XML para carregar os arquivos exportados.

4.  Importe e comite a v4 primeiro — ela contém a estrutura das páginas, o catálogo, o Flow e as traduções.

5.  Em seguida importe e comite a v3, que traz os widgets e os ajustes visuais mais recentes. Essa ordem garante que a versão mais nova de cada registro fique por cima.

6.  Rode os scripts de carga em Scripts - Background, nesta ordem: 01-carga-catalogo.js (catálogo, categorias, itens e variáveis) e depois 02-carga-kb.js (base de conhecimento e artigos).

7.  Acesse /vp.

> **Se o cabeçalho não aparecer**
>
> Confira o campo Header do tema Violeta Theme. Ele só lista registros da tabela sp_header_footer — um widget criado em sp_widget nunca aparecerá ali.

## 6. Limitações conhecidas

Documentadas de propósito. São restrições do ambiente ou dívida técnica assumida conscientemente.

| **Limitação**                  | **Motivo e situação**                                                                                                                                                                                                                                            |
|--------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| E-mail não é entregue na PDI   | A notificação é gerada e permanece em send-ready porque a instância não tem sys_email_account de saída provisionada. A lógica está correta e funciona em instância com e-mail habilitado.                                                                        |
| ATF incompleto                 | Os testes de Service Portal e o script de carrinho com sn_sc.CartJS ficaram pendentes.                                                                                                                                                                           |
| Modo escuro por injeção de CSS | O compilador SCSS do Service Portal não aplicou as regras a tempo, então o CSS do tema escuro é injetado em tempo de execução pelo controller do cabeçalho, com !important. Funciona de forma consistente, mas o caminho limpo seria usar variáveis CSS no tema. |
| Widget de analytics OOB        | Removido do DOM por um laço \$interval no rodapé, por não ter customização própria.                                                                                                                                                                              |

## 7. Caderno de campo

Armadilhas encontradas durante a construção que custaram mais tempo. Valem como referência para projetos futuros.

- Campos traduzidos, como o title de sc_category, devem ser lidos com getDisplayValue() e não getValue(). E addQuery sobre eles não encontra nada: carregue todos os registros e compare em JavaScript.

- orderByDesc() em um campo inexistente não gera erro — retorna zero linhas em silêncio.

- Strings vindas do Java não possuem charAt(). Envolva o valor em String() antes de usar métodos de texto.

- O Service Portal Designer costuma reabrir a última página editada, ignorando a URL. Use sempre a aba Pages para escolher a página.

- A URL sc_catalog sem o sufixo .list abre a vitrine do catálogo, não a lista de registros.

- Uma regra CSS colada dentro de um bloco @media herda todos os pais. Regras globais devem ficar no fim do arquivo.

## 8. Roteiro de gravação do vídeo

### 8.1 Preparação

- Aba anônima, sem barra de favoritos, zoom em 100% (ou 110% em telas grandes).

- Entre com um usuário não-admin, para não exibir a barra da plataforma.

- Desative as notificações do sistema operacional.

- Deixe uma solicitação já aberta e uma já encerrada, para as telas não aparecerem vazias.

- Grave em 1080p, com o cursor visível e sem música de fundo.

### 8.2 Sequência sugerida (5 a 7 minutos)

| **Bloco**                | **Duração** | **O que mostrar**                                                                                                                                             |
|--------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1\. Abertura             | 20s         | O /vp carregando. "Este é o Portal Violeta, um portal de autoatendimento de banco digital construído sobre o Service Portal. Nenhuma tela aqui é de fábrica." |
| 2\. Home                 | 40s         | Role devagar para exibir o scroll reveal. Passe o mouse nos cards para mostrar as micro-interações.                                                           |
| 3\. Modo escuro          | 20s         | Alterne no cabeçalho e recarregue a página para provar que a preferência ficou salva.                                                                         |
| 4\. Jornada do cliente   | 90s         | Categoria, item, CEP preenchendo o endereço sozinho, envio, confirmação e detalhe da solicitação.                                                             |
| 5\. Aprovação            | 60s         | Envie um limite acima de R$ 10.000, mostre a Business Rule e o Flow parando na aprovação. Cite a armadilha do gatilho do catálogo em uma frase.              |
| 6\. Base de conhecimento | 30s         | FAQ e artigo.                                                                                                                                                 |
| 7\. Painel do atendente  | 30s         | Indicadores agregados com GlideAggregate.                                                                                                                     |
| 8\. Design system        | 30s         | A página vp_design, paleta e componentes.                                                                                                                     |
| 9\. Bastidores           | 60s         | Abra um widget no Designer e mostre os quatro campos. Abra o Flow. Abra a Update Set.                                                                         |
| 10\. Fechamento          | 20s         | Cite as limitações honestamente e o link do repositório.                                                                                                      |

> **Dica de gravação**
>
> Grave cada bloco separadamente. Refazer um trecho de trinta segundos é muito mais rápido do que refazer a gravação inteira — e o corte entre blocos fica natural no vídeo final.

## 9. Autor

**Yago Dresler — ServiceNow Developer**

LinkedIn: https://www.linkedin.com/in/yagodresler

Portfólio: https://developeryagodresler.netlify.app/
