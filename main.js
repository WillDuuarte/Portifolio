/* ============================================================
   Portfólio — interações
   ============================================================ */

(function () {
    'use strict';

    var prefereMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var temObservador = 'IntersectionObserver' in window;

    function entre(min, max) {
        return min + Math.random() * (max - min);
    }

    /* ------------------------------------------------------------
       Menu mobile
    ------------------------------------------------------------ */
    function iniciarMenu() {
        var navbar = document.querySelector('#navbar');
        var botao = document.querySelector('#nav-toggle');
        var menu = document.querySelector('#nav-menu');

        if (!navbar || !botao || !menu) return;

        function abrir() {
            navbar.classList.add('menu-aberto');
            botao.setAttribute('aria-expanded', 'true');
            botao.setAttribute('aria-label', 'Fechar menu');
            document.body.classList.add('sem-scroll');
        }

        function fechar(devolverFoco) {
            if (!navbar.classList.contains('menu-aberto')) return;
            navbar.classList.remove('menu-aberto');
            botao.setAttribute('aria-expanded', 'false');
            botao.setAttribute('aria-label', 'Abrir menu');
            document.body.classList.remove('sem-scroll');
            if (devolverFoco) botao.focus();
        }

        botao.addEventListener('click', function () {
            if (navbar.classList.contains('menu-aberto')) fechar();
            else abrir();
        });

        // fecha ao escolher um destino
        menu.addEventListener('click', function (evento) {
            if (evento.target.closest('a')) fechar();
        });

        document.addEventListener('keydown', function (evento) {
            if (evento.key === 'Escape') fechar(true);
        });

        // fecha ao clicar fora da navegação
        document.addEventListener('click', function (evento) {
            if (!evento.target.closest('#navbar')) fechar();
        });

        // volta ao estado normal quando a tela cresce
        var telaGrande = window.matchMedia('(min-width: 768px)');
        telaGrande.addEventListener('change', function (evento) {
            if (evento.matches) fechar();
        });
    }

    /* ------------------------------------------------------------
       Navegação: fundo ao rolar + destaque da seção ativa
    ------------------------------------------------------------ */
    function iniciarNavegacao() {
        var navbar = document.querySelector('#navbar');
        var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));

        if (!navbar || !links.length) return;

        function atualizarFundo() {
            navbar.classList.toggle('rolado', window.scrollY > 24);
        }

        atualizarFundo();
        window.addEventListener('scroll', atualizarFundo, { passive: true });

        var secoes = links
            .map(function (link) {
                return document.querySelector(link.getAttribute('href'));
            })
            .filter(Boolean);

        if (!secoes.length || !temObservador) return;

        function marcarAtivo(id) {
            links.forEach(function (link) {
                var ativo = link.getAttribute('href') === '#' + id;
                link.classList.toggle('ativo', ativo);
                if (ativo) link.setAttribute('aria-current', 'true');
                else link.removeAttribute('aria-current');
            });
        }

        // a "linha de leitura" fica no meio da tela: só uma seção a cruza por vez
        var observador = new IntersectionObserver(
            function (entradas) {
                entradas.forEach(function (entrada) {
                    if (entrada.isIntersecting) marcarAtivo(entrada.target.id);
                });
            },
            { rootMargin: '-45% 0px -55% 0px' }
        );

        secoes.forEach(function (secao) {
            observador.observe(secao);
        });
    }

    /* ------------------------------------------------------------
       Revelação ao rolar
    ------------------------------------------------------------ */
    function iniciarRevelacao() {
        var alvos = Array.prototype.slice.call(document.querySelectorAll('[data-revelar]'));

        if (!alvos.length) return;

        // escalona os itens dentro de cada grupo
        document.querySelectorAll('[data-revelar-grupo]').forEach(function (grupo) {
            var ciclo = Number(grupo.dataset.revelarCiclo) || 3;
            grupo.querySelectorAll('[data-revelar]').forEach(function (item, indice) {
                item.style.setProperty('--atraso', (indice % ciclo) * 90 + 'ms');
            });
        });

        if (prefereMenosMovimento || !temObservador) {
            alvos.forEach(function (alvo) {
                alvo.classList.add('visivel');
            });
            return;
        }

        var observador = new IntersectionObserver(
            function (entradas, obs) {
                entradas.forEach(function (entrada) {
                    if (!entrada.isIntersecting) return;
                    entrada.target.classList.add('visivel');
                    obs.unobserve(entrada.target);
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        );

        alvos.forEach(function (alvo) {
            observador.observe(alvo);
        });
    }

    /* ------------------------------------------------------------
       Filtro dos projetos
    ------------------------------------------------------------ */
    function iniciarFiltro() {
        var barra = document.querySelector('#filtros');
        var projetos = Array.prototype.slice.call(document.querySelectorAll('#projetos .projeto'));

        if (!barra || !projetos.length) return;

        var botoes = Array.prototype.slice.call(barra.querySelectorAll('.filtro'));
        var status = document.querySelector('#filtro-status');

        function aplicar(filtro, animar) {
            var visiveis = 0;

            projetos.forEach(function (projeto) {
                projeto.classList.remove('entrando');
            });

            // força o recálculo de estilo para que a animação possa reiniciar
            if (animar) void barra.offsetWidth;

            projetos.forEach(function (projeto) {
                var categorias = (projeto.dataset.categoria || '').split(/\s+/);
                var mostrar = filtro === 'todos' || categorias.indexOf(filtro) !== -1;

                projeto.classList.toggle('oculto', !mostrar);

                if (!mostrar) return;

                visiveis += 1;
                // garante que cartões ainda não revelados apareçam junto com o filtro
                projeto.classList.add('visivel');
                if (animar) projeto.classList.add('entrando');
            });

            botoes.forEach(function (botao) {
                botao.setAttribute('aria-pressed', String(botao.dataset.filtro === filtro));
            });

            if (status) {
                status.textContent = visiveis === 1 ? '1 projeto encontrado' : visiveis + ' projetos encontrados';
            }
        }

        barra.addEventListener('click', function (evento) {
            var botao = evento.target.closest('.filtro');
            if (!botao) return;
            aplicar(botao.dataset.filtro, !prefereMenosMovimento);
        });
    }

    /* ------------------------------------------------------------
       Vento de fundo
    ------------------------------------------------------------ */
    function iniciarVento() {
        var canvas = document.querySelector('#vento');
        if (!canvas || !canvas.getContext) return;

        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        var cores = ['#3996DB', '#BB72E9', '#82BC4F', '#EABD5F', '#E3646E'];
        var rajadas = [];
        var largura = 0;
        var altura = 0;
        var quadroAtual = null;
        var ultimoTempo = 0;

        // profundidade 0 = ao fundo (lenta, fina, apagada); 1 = à frente
        function nascer(rajada, espalhar) {
            var profundidade = Math.random();

            rajada.profundidade = profundidade;
            rajada.comprimento = entre(90, 260) * (0.55 + profundidade);
            rajada.velocidade = 18 + profundidade * 95;
            rajada.espessura = 0.6 + profundidade * 1.5;
            rajada.alfa = 0.09 + profundidade * 0.3;
            rajada.cor = cores[Math.floor(Math.random() * cores.length)];
            rajada.brilho = profundidade > 0.55;
            rajada.inclinacao = entre(-0.07, 0.07); // dy/dx: tira o ar mecânico do traço reto
            rajada.balanco = entre(3, 14);
            rajada.fase = Math.random() * Math.PI * 2;
            rajada.ritmo = entre(0.25, 0.7);
            rajada.y = entre(-20, altura + 20);
            rajada.x = espalhar
                ? entre(-rajada.comprimento, largura)
                : entre(-largura * 0.4, -rajada.comprimento);

            return rajada;
        }

        function desenhar(rajada) {
            var x1 = rajada.x;
            var x2 = rajada.x + rajada.comprimento;
            var y1 = rajada.y + Math.sin(rajada.fase) * rajada.balanco;
            var y2 = y1 + rajada.comprimento * rajada.inclinacao;

            // cauda transparente, cabeça acesa e uma ponta curta que se apaga
            var gradiente = ctx.createLinearGradient(x1, y1, x2, y2);
            gradiente.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradiente.addColorStop(0.86, rajada.cor);
            gradiente.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.strokeStyle = gradiente;

            // halo barato: o mesmo traço, mais grosso e mais apagado
            if (rajada.brilho) {
                ctx.globalAlpha = rajada.alfa * 0.26;
                ctx.lineWidth = rajada.espessura * 5;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            ctx.globalAlpha = rajada.alfa;
            ctx.lineWidth = rajada.espessura;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        function redimensionar() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);

            largura = canvas.clientWidth;
            altura = canvas.clientHeight;

            canvas.width = Math.max(1, Math.floor(largura * dpr));
            canvas.height = Math.max(1, Math.floor(altura * dpr));

            // trocar o tamanho do buffer zera o estado do contexto
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';

            var quantidade = Math.round(Math.min(70, Math.max(16, (largura * altura) / 26000)));

            while (rajadas.length > quantidade) rajadas.pop();
            while (rajadas.length < quantidade) rajadas.push(nascer({}, true));

            rajadas.forEach(function (rajada) {
                if (rajada.y > altura + 20) rajada.y = entre(-20, altura + 20);
            });
        }

        function pintar() {
            ctx.clearRect(0, 0, largura, altura);
            rajadas.forEach(desenhar);
        }

        function quadro(tempo) {
            var dt = Math.min((tempo - ultimoTempo) / 1000, 0.05);
            ultimoTempo = tempo;

            rajadas.forEach(function (rajada) {
                rajada.x += rajada.velocidade * dt;
                rajada.y -= rajada.velocidade * 0.06 * dt; // leve subida diagonal
                rajada.fase += rajada.ritmo * dt;

                if (rajada.x > largura) nascer(rajada, false);
                else if (rajada.y < -40) rajada.y = altura + 40;
            });

            pintar();
            quadroAtual = window.requestAnimationFrame(quadro);
        }

        function tocar() {
            if (quadroAtual !== null) return;
            ultimoTempo = window.performance.now();
            quadroAtual = window.requestAnimationFrame(quadro);
        }

        function pausar() {
            if (quadroAtual === null) return;
            window.cancelAnimationFrame(quadroAtual);
            quadroAtual = null;
        }

        redimensionar();

        var esperaResize = null;
        window.addEventListener('resize', function () {
            window.clearTimeout(esperaResize);
            esperaResize = window.setTimeout(function () {
                redimensionar();
                if (quadroAtual === null) pintar();
            }, 150);
        });

        // sem movimento: uma única passada, só pela textura
        if (prefereMenosMovimento) {
            pintar();
            return;
        }

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) pausar();
            else tocar();
        });

        tocar();
    }

    /* ------------------------------------------------------------
       Rastro branco no cursor
    ------------------------------------------------------------ */
    function iniciarRastro() {
        var canvas = document.querySelector('#rastro');
        if (!canvas || !canvas.getContext) return;

        // sem cursor para seguir, ou com movimento reduzido, não entra em cena
        if (prefereMenosMovimento || !window.matchMedia('(pointer: fine)').matches) return;

        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        var LIMITE = 150; // teto de marcas vivas: alto o bastante para o rastro
                          // acabar pelo tempo de vida, não por corte na cauda
        var ESPACO = 7; // px entre marcas ao preencher o caminho
        var SALTO_MAXIMO = 260; // acima disso o ponteiro "pulou" (troca de aba, etc.)
        var DURACAO = 0.5; // s de vida de cada marca
        var LADO_PINCEL = 128;

        var marcas = [];
        var largura = 0;
        var altura = 0;
        var quadroAtual = null;
        var ultimoTempo = 0;
        var ultimoX = null;
        var ultimoY = null;

        // borrão branco desenhado uma única vez; cada marca é só um drawImage
        // escalado — bem mais barato que criar um gradiente por marca por quadro
        var pincel = document.createElement('canvas');

        function prepararPincel() {
            pincel.width = LADO_PINCEL;
            pincel.height = LADO_PINCEL;

            var p = pincel.getContext('2d');
            var meio = LADO_PINCEL / 2;
            var gradiente = p.createRadialGradient(meio, meio, 0, meio, meio, meio);

            gradiente.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradiente.addColorStop(0.32, 'rgba(255, 255, 255, 0.42)');
            gradiente.addColorStop(0.68, 'rgba(255, 255, 255, 0.09)');
            gradiente.addColorStop(1, 'rgba(255, 255, 255, 0)');

            p.fillStyle = gradiente;
            p.fillRect(0, 0, LADO_PINCEL, LADO_PINCEL);
        }

        function redimensionar() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);

            largura = canvas.clientWidth;
            altura = canvas.clientHeight;

            canvas.width = Math.max(1, Math.floor(largura * dpr));
            canvas.height = Math.max(1, Math.floor(altura * dpr));

            // trocar o tamanho do buffer zera o estado do contexto
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.globalCompositeOperation = 'lighter';
        }

        function marcar(x, y) {
            marcas.push({ x: x, y: y, vida: 1, raio: entre(11, 17) });
            if (marcas.length > LIMITE) marcas.splice(0, marcas.length - LIMITE);
        }

        function desenharMarca(marca) {
            var raio = marca.raio * (0.35 + marca.vida * 0.65); // afina ao envelhecer

            ctx.globalAlpha = marca.vida * marca.vida * 0.17;
            ctx.drawImage(pincel, marca.x - raio, marca.y - raio, raio * 2, raio * 2);
        }

        function quadro(tempo) {
            var dt = Math.min((tempo - ultimoTempo) / 1000, 0.05);
            ultimoTempo = tempo;

            ctx.clearRect(0, 0, largura, altura);

            for (var i = marcas.length - 1; i >= 0; i--) {
                marcas[i].vida -= dt / DURACAO;
                if (marcas[i].vida <= 0) marcas.splice(i, 1);
                else desenharMarca(marcas[i]);
            }

            // sem nada em cena, dorme até o próximo movimento
            if (!marcas.length) {
                quadroAtual = null;
                return;
            }

            quadroAtual = window.requestAnimationFrame(quadro);
        }

        function tocar() {
            if (quadroAtual !== null) return;
            ultimoTempo = window.performance.now();
            quadroAtual = window.requestAnimationFrame(quadro);
        }

        function esquecerPosicao() {
            ultimoX = null;
            ultimoY = null;
        }

        function aoMover(evento) {
            var x = evento.clientX;
            var y = evento.clientY;

            if (ultimoX === null) {
                ultimoX = x;
                ultimoY = y;
                marcar(x, y);
                tocar();
                return;
            }

            var dx = x - ultimoX;
            var dy = y - ultimoY;
            var distancia = Math.sqrt(dx * dx + dy * dy);

            if (distancia > SALTO_MAXIMO) {
                ultimoX = x;
                ultimoY = y;
                return;
            }

            // preenche o caminho: sem isso o rastro sai pontilhado em movimento rápido
            var passos = Math.max(1, Math.round(distancia / ESPACO));
            for (var i = 1; i <= passos; i++) {
                marcar(ultimoX + dx * (i / passos), ultimoY + dy * (i / passos));
            }

            ultimoX = x;
            ultimoY = y;
            tocar();
        }

        prepararPincel();
        redimensionar();

        var esperaResize = null;
        window.addEventListener('resize', function () {
            window.clearTimeout(esperaResize);
            esperaResize = window.setTimeout(redimensionar, 150);
        });

        window.addEventListener('mousemove', aoMover, { passive: true });
        document.addEventListener('mouseleave', esquecerPosicao);
        window.addEventListener('blur', esquecerPosicao);
        document.addEventListener('visibilitychange', esquecerPosicao);
    }

    function iniciar() {
        iniciarVento();
        iniciarRastro();
        iniciarMenu();
        iniciarNavegacao();
        iniciarRevelacao();
        iniciarFiltro();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
