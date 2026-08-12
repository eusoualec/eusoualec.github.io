/*------------------------------------------------------------------------------
  JavaScript do site — sem dependências.

  Substitui o bootstrap.js (menu e carrossel) e o prettyPhoto (lightbox).
------------------------------------------------------------------------------*/
(function () {
  'use strict';

  var semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     Menu recolhido
     ========================================================================== */
  function iniciaMenu() {
    var botao = document.querySelector('.navbar-toggle');
    if (!botao) return;

    var alvo = document.querySelector(botao.getAttribute('data-target'));
    if (!alvo) return;

    botao.addEventListener('click', function () {
      var aberto = alvo.classList.toggle('in');
      botao.classList.toggle('collapsed', !aberto);
      botao.setAttribute('aria-expanded', String(aberto));
    });
  }

  /* ==========================================================================
     Carrossel da home

     Troca por fade, com autoplay pausável. O autoplay não roda para quem pede
     menos animação no sistema, e para de vez quando o visitante usa qualquer
     um dos controles — nesse caso ele assume a navegação.
     ========================================================================== */
  function iniciaCarrossel() {
    var raiz = document.querySelector('.carousel');
    if (!raiz) return;

    var itens = Array.prototype.slice.call(raiz.querySelectorAll('.carousel-inner > .item'));
    if (itens.length < 2) return;

    var indicadores = Array.prototype.slice.call(raiz.querySelectorAll('.carousel-indicators [data-slide-to]'));
    var intervalo = parseInt(raiz.getAttribute('data-interval'), 10) || 7500;
    var atual = Math.max(0, itens.findIndex(function (i) { return i.classList.contains('active'); }));
    var timer = null;
    var emTransicao = false;

    function mostra(destino) {
      destino = (destino + itens.length) % itens.length;
      if (destino === atual || emTransicao) return;

      var sai = itens[atual];
      var entra = itens[destino];
      atual = destino;

      indicadores.forEach(function (ind, i) {
        ind.classList.toggle('active', i === destino);
        ind.setAttribute('aria-current', i === destino ? 'true' : 'false');
      });

      if (semAnimacao) {
        sai.classList.remove('active');
        entra.classList.add('active');
        return;
      }

      emTransicao = true;
      entra.classList.add('entrando');
      // força o cálculo de layout para o fade partir de opacity 0
      void entra.offsetWidth;
      entra.classList.add('visivel');

      var finaliza = function () {
        entra.removeEventListener('transitionend', finaliza);
        sai.classList.remove('active');
        entra.classList.remove('entrando', 'visivel');
        entra.classList.add('active');
        emTransicao = false;
      };
      entra.addEventListener('transitionend', finaliza);
      // rede de seguranca: se o transitionend nao vier, conclui na marra
      setTimeout(function () { if (emTransicao) finaliza(); }, 900);
    }

    // "ligado" e a intencao do visitante; o timer e o estado do momento. Pausas
    // temporarias (hover, foco, aba oculta) mexem so no timer, nunca na
    // intencao — senao passar o mouse sobre o botao ja o deixaria invertido.
    var ligado = !semAnimacao;

    function inicia() {
      if (timer || !ligado) return;
      timer = setInterval(function () { mostra(atual + 1); }, intervalo);
    }

    function para() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    }

    var botaoPausa = raiz.querySelector('.carousel-pausa');

    function atualizaBotaoPausa() {
      if (!botaoPausa) return;
      botaoPausa.setAttribute('aria-pressed', String(!ligado));
      botaoPausa.setAttribute('aria-label', ligado
        ? 'Pausar a troca automática de slides'
        : 'Retomar a troca automática de slides');
      botaoPausa.textContent = ligado ? '\u2759\u2759' : '\u25B6';
    }

    function desliga() {
      ligado = false;
      para();
      atualizaBotaoPausa();
    }

    if (botaoPausa) {
      botaoPausa.addEventListener('click', function () {
        ligado = !ligado;
        if (ligado) { inicia(); } else { para(); }
        atualizaBotaoPausa();
      });
    }

    // Usar as setas ou os indicadores significa assumir a navegacao: o
    // autoplay para e so volta se o visitante pedir.
    raiz.querySelectorAll('[data-slide]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        desliga();
        mostra(atual + (botao.getAttribute('data-slide') === 'prev' ? -1 : 1));
      });
    });

    indicadores.forEach(function (ind, i) {
      ind.addEventListener('click', function () {
        desliga();
        mostra(i);
      });
    });

    // Pausa enquanto o ponteiro ou o teclado estao dentro do carrossel,
    // e enquanto a aba nao esta visivel.
    raiz.addEventListener('mouseenter', para);
    raiz.addEventListener('mouseleave', inicia);
    raiz.addEventListener('focusin', para);
    raiz.addEventListener('focusout', function (e) {
      if (!raiz.contains(e.relatedTarget)) inicia();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { para(); } else { inicia(); }
    });

    inicia();
    atualizaBotaoPausa();

    // As imagens dos slides seguintes nascem lazy para não disputar banda com
    // a primeira pintura; assim que a página carrega, são buscadas em segundo
    // plano, com folga antes da primeira troca.
    window.addEventListener('load', function () {
      raiz.querySelectorAll('.item img[loading="lazy"]').forEach(function (img) {
        img.loading = 'eager';
      });
    });
  }

  /* ==========================================================================
     Lightbox da galeria, sobre o <dialog> nativo

     O <dialog> já entrega, de graça, o que o prettyPhoto fazia à mão: fundo
     modal, prisão de foco, fechar no Esc e devolver o foco ao link de origem.
     ========================================================================== */
  function iniciaLightbox() {
    var links = Array.prototype.slice.call(document.querySelectorAll('a.lightbox'));
    if (!links.length || !window.HTMLDialogElement) return;

    var dialogo = document.createElement('dialog');
    dialogo.className = 'lightbox-dialog';
    dialogo.setAttribute('aria-label', 'Galeria de fotos');
    dialogo.innerHTML =
      '<figure class="lightbox-figure"><img alt=""></figure>' +
      '<button type="button" class="lightbox-anterior" aria-label="Foto anterior">&#8249;</button>' +
      '<button type="button" class="lightbox-proxima" aria-label="Próxima foto">&#8250;</button>' +
      '<button type="button" class="lightbox-fechar" aria-label="Fechar">&times;</button>' +
      '<p class="lightbox-contador" aria-live="polite"></p>';
    document.body.appendChild(dialogo);

    var imagem = dialogo.querySelector('img');
    var contador = dialogo.querySelector('.lightbox-contador');
    var indice = 0;

    function carrega(i) {
      indice = (i + links.length) % links.length;
      imagem.src = links[indice].getAttribute('href');
      imagem.alt = 'Foto ' + (indice + 1) + ' de ' + links.length + ' da galeria';
      contador.textContent = (indice + 1) + ' / ' + links.length;
      // deixa a vizinha pronta, para a navegação não piscar
      var proxima = new Image();
      proxima.src = links[(indice + 1) % links.length].getAttribute('href');
    }

    links.forEach(function (link, i) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        carrega(i);
        dialogo.showModal();
      });
    });

    dialogo.querySelector('.lightbox-fechar').addEventListener('click', function () { dialogo.close(); });
    dialogo.querySelector('.lightbox-anterior').addEventListener('click', function () { carrega(indice - 1); });
    dialogo.querySelector('.lightbox-proxima').addEventListener('click', function () { carrega(indice + 1); });

    dialogo.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); carrega(indice - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); carrega(indice + 1); }
    });

    // clique no fundo (fora da imagem) fecha
    dialogo.addEventListener('click', function (e) {
      if (e.target === dialogo || e.target.classList.contains('lightbox-figure')) dialogo.close();
    });
  }

  function inicia() {
    iniciaMenu();
    iniciaCarrossel();
    iniciaLightbox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicia);
  } else {
    inicia();
  }
})();
