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

        // pílula que desliza por trás do botão escolhido
        var indicador = document.createElement('span');
        indicador.className = 'filtro-indicador';
        indicador.setAttribute('aria-hidden', 'true');
        barra.insertBefore(indicador, barra.firstChild);
        barra.classList.add('com-indicador');

        function botaoAtivo() {
            for (var i = 0; i < botoes.length; i++) {
                if (botoes[i].getAttribute('aria-pressed') === 'true') return botoes[i];
            }
            return botoes[0];
        }

        // na primeira medida, e a cada remedida, a pílula assume o lugar sem
        // deslizar: só a troca de filtro merece o movimento
        function posicionarIndicador(botao, instantaneo) {
            if (!botao) return;

            if (instantaneo) indicador.classList.add('sem-transicao');

            indicador.style.setProperty('--x', botao.offsetLeft + 'px');
            indicador.style.setProperty('--y', botao.offsetTop + 'px');
            indicador.style.setProperty('--w', botao.offsetWidth + 'px');
            indicador.style.setProperty('--h', botao.offsetHeight + 'px');

            if (instantaneo) {
                void indicador.offsetWidth;
                indicador.classList.remove('sem-transicao');
            }
        }

        // posições de partida para o FLIP: os cartões deslizam até o novo lugar
        function medirCartoes() {
            return projetos.map(function (projeto) {
                return {
                    caixa: projeto.getBoundingClientRect(),
                    visivel: !projeto.classList.contains('oculto')
                };
            });
        }

        function deslizarCartoes(antes) {
            var destinos = projetos.map(function (projeto) {
                return projeto.classList.contains('oculto') ? null : projeto.getBoundingClientRect();
            });

            projetos.forEach(function (projeto, indice) {
                var destino = destinos[indice];
                if (!destino) return;

                // cartão que acabou de entrar não tem de onde deslizar
                if (!antes[indice].visivel) {
                    projeto.classList.add('entrando');
                    return;
                }

                var dx = antes[indice].caixa.left - destino.left;
                var dy = antes[indice].caixa.top - destino.top;
                if (!dx && !dy) return;

                projeto.classList.add('sem-transicao');
                projeto.style.setProperty('--desvio-x', dx.toFixed(1) + 'px');
                projeto.style.setProperty('--desvio-y', dy.toFixed(1) + 'px');
                void projeto.offsetWidth;
                projeto.classList.remove('sem-transicao');
                projeto.style.setProperty('--desvio-x', '0px');
                projeto.style.setProperty('--desvio-y', '0px');
            });
        }

        function aplicar(filtro, animar) {
            var visiveis = 0;

            projetos.forEach(function (projeto) {
                projeto.classList.remove('entrando');
            });

            var antes = animar ? medirCartoes() : null;

            projetos.forEach(function (projeto) {
                var categorias = (projeto.dataset.categoria || '').split(/s+/);
                var mostrar = filtro === 'todos' || categorias.indexOf(filtro) !== -1;

                projeto.classList.toggle('oculto', !mostrar);

                if (!mostrar) return;

                visiveis += 1;
                // garante que cartões ainda não revelados apareçam junto com o filtro
                projeto.classList.add('visivel');
            });

            if (antes) deslizarCartoes(antes);

            botoes.forEach(function (botao) {
                botao.setAttribute('aria-pressed', String(botao.dataset.filtro === filtro));
            });

            posicionarIndicador(botaoAtivo());

            if (status) {
                status.textContent = visiveis === 1 ? '1 projeto encontrado' : visiveis + ' projetos encontrados';
            }
        }

        barra.addEventListener('click', function (evento) {
            var botao = evento.target.closest('.filtro');
            if (!botao) return;
            aplicar(botao.dataset.filtro, !prefereMenosMovimento);
        });

        var esperaResize = null;
        window.addEventListener('resize', function () {
            window.clearTimeout(esperaResize);
            esperaResize = window.setTimeout(function () {
                posicionarIndicador(botaoAtivo(), true);
            }, 150);
        });

        posicionarIndicador(botaoAtivo(), true);

        // a fonte da web muda a largura dos botões depois de carregar
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
                posicionarIndicador(botaoAtivo(), true);
            });
        }
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

    /* ------------------------------------------------------------
       Esteira infinita
    ------------------------------------------------------------ */
    function iniciarEsteira() {
        Array.prototype.slice.call(document.querySelectorAll('[data-esteira]')).forEach(montarEsteira);
    }

    function montarEsteira(caixa) {
        var grupo = caixa.querySelector('.esteira-grupo');
        if (!grupo) return;

        // sem movimento: vira uma faixa que a própria pessoa rola
        if (prefereMenosMovimento) {
            caixa.classList.add('esteira-estatica');
            return;
        }

        var direcao = Number(caixa.dataset.direcao) || 1;
        var velocidade = Number(caixa.dataset.velocidade) || 40;

        var trilho = document.createElement('div');
        trilho.className = 'esteira-trilho';
        caixa.insertBefore(trilho, grupo);
        trilho.appendChild(grupo);

        var largura = 0; // largura de um grupo + o vão até o próximo
        var deslocamento = 0;
        var impulso = 0; // sobra de velocidade depois de arrastar
        var fator = 1; // desacelera quando o cursor está em cima
        var alvoFator = 1;
        var quadroAtual = null;
        var ultimoTempo = 0;
        var pausas = 0;
        var arrastando = false;
        var ultimoX = 0;
        var ultimoMovimento = 0;

        function aplicar() {
            trilho.style.transform = 'translate3d(' + deslocamento.toFixed(2) + 'px, 0, 0)';
        }

        function avancar(px) {
            if (!largura) return;
            deslocamento += px;
            // mantém o deslocamento dentro de um grupo: a emenda nunca aparece
            deslocamento = ((deslocamento % largura) - largura) % largura;
            aplicar();
        }

        function medir() {
            while (trilho.children.length > 1) trilho.removeChild(trilho.lastChild);

            var estilo = window.getComputedStyle(trilho);
            var vao = parseFloat(estilo.columnGap || estilo.gap) || 0;

            largura = grupo.getBoundingClientRect().width + vao;
            if (!largura) return;

            // cópias suficientes para cobrir a tela mais um grupo de folga
            var copias = Math.ceil(caixa.clientWidth / largura) + 1;
            for (var i = 0; i < copias; i++) {
                var clone = grupo.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                trilho.appendChild(clone);
            }

            avancar(0);
        }

        function quadro(tempo) {
            var dt = Math.min((tempo - ultimoTempo) / 1000, 0.05);
            ultimoTempo = tempo;

            fator += (alvoFator - fator) * Math.min(1, dt * 6);

            if (!arrastando) {
                avancar((-velocidade * direcao * fator + impulso) * dt);
                impulso *= Math.pow(0.0025, dt); // o empurrão some em cerca de 1s
                if (Math.abs(impulso) < 1) impulso = 0;
            }

            quadroAtual = window.requestAnimationFrame(quadro);
        }

        function tocar() {
            if (quadroAtual !== null || pausas > 0) return;
            ultimoTempo = window.performance.now();
            quadroAtual = window.requestAnimationFrame(quadro);
        }

        function pausar() {
            if (quadroAtual === null) return;
            window.cancelAnimationFrame(quadroAtual);
            quadroAtual = null;
        }

        function segurar() {
            pausas += 1;
            pausar();
        }

        function soltar() {
            pausas = Math.max(0, pausas - 1);
            if (!pausas) tocar();
        }

        // o cursor em cima não congela a faixa, só a deixa lenta:
        // assim ainda dá para ler e para arrastar
        caixa.addEventListener('pointerenter', function (evento) {
            if (evento.pointerType === 'mouse') alvoFator = 0.22;
        });

        caixa.addEventListener('pointerleave', function () {
            alvoFator = 1;
        });

        caixa.addEventListener('pointerdown', function (evento) {
            if (evento.button) return;
            arrastando = true;
            impulso = 0;
            ultimoX = evento.clientX;
            ultimoMovimento = window.performance.now();
            caixa.classList.add('arrastando');
            if (caixa.setPointerCapture) caixa.setPointerCapture(evento.pointerId);
        });

        caixa.addEventListener('pointermove', function (evento) {
            if (!arrastando) return;

            var agora = window.performance.now();
            var dx = evento.clientX - ultimoX;

            avancar(dx);
            impulso = Math.max(-2200, Math.min(2200, dx / (Math.max(agora - ultimoMovimento, 8) / 1000)));
            ultimoX = evento.clientX;
            ultimoMovimento = agora;
        });

        function largarPonteiro(evento) {
            if (!arrastando) return;
            arrastando = false;
            caixa.classList.remove('arrastando');
            ultimoTempo = window.performance.now();
            if (caixa.releasePointerCapture && caixa.hasPointerCapture && caixa.hasPointerCapture(evento.pointerId)) {
                caixa.releasePointerCapture(evento.pointerId);
            }
        }

        caixa.addEventListener('pointerup', largarPonteiro);
        caixa.addEventListener('pointercancel', largarPonteiro);

        var esperaResize = null;
        window.addEventListener('resize', function () {
            window.clearTimeout(esperaResize);
            esperaResize = window.setTimeout(medir, 200);
        });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) segurar();
            else soltar();
        });

        // fora da tela a faixa não gasta quadro nenhum
        if (temObservador) {
            new IntersectionObserver(
                function (entradas) {
                    entradas.forEach(function (entrada) {
                        if (entrada.isIntersecting) soltar();
                        else segurar();
                    });
                },
                { rootMargin: '150px 0px' }
            ).observe(caixa);
        }

        medir();
        tocar();

        // a fonte da web troca as larguras depois de carregar
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(medir);
        }
    }

    /* ------------------------------------------------------------
       Títulos que sobem palavra por palavra
    ------------------------------------------------------------ */
    function iniciarTitulos() {
        Array.prototype.slice.call(document.querySelectorAll('[data-dividir]')).forEach(function (titulo) {
            var palavras = titulo.textContent.trim().split(/\s+/);

            titulo.textContent = '';

            palavras.forEach(function (palavra, indice) {
                var caixa = document.createElement('span');
                var interno = document.createElement('span');

                caixa.className = 'palavra';
                caixa.style.setProperty('--i', indice);
                interno.textContent = palavra;
                caixa.appendChild(interno);

                titulo.appendChild(caixa);
                if (indice < palavras.length - 1) titulo.appendChild(document.createTextNode(' '));
            });
        });
    }

    /* ------------------------------------------------------------
       Cargo que se digita sozinho no título
    ------------------------------------------------------------ */
    function iniciarPapeis() {
        var alvo = document.querySelector('#papel');
        if (!alvo) return;

        var papeis = (alvo.dataset.papeis || '').split('|').filter(Boolean);
        if (!papeis.length) return;

        alvo.textContent = papeis[0];

        if (papeis.length < 2 || prefereMenosMovimento) return;

        var indice = 0;
        var texto = papeis[0];
        var apagando = true;
        var espera = null;

        function passo() {
            var papel = papeis[indice % papeis.length];

            if (apagando) {
                texto = papel.slice(0, Math.max(0, texto.length - 1));
                alvo.textContent = texto;

                if (!texto) {
                    apagando = false;
                    indice += 1;
                    espera = window.setTimeout(passo, 280);
                    return;
                }

                espera = window.setTimeout(passo, 34);
                return;
            }

            texto = papel.slice(0, texto.length + 1);
            alvo.textContent = texto;

            if (texto === papel) {
                apagando = true;
                espera = window.setTimeout(passo, 2000);
                return;
            }

            espera = window.setTimeout(passo, 68);
        }

        // pausa com a aba escondida: nada de digitar para uma tela que ninguém vê
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) window.clearTimeout(espera);
            else espera = window.setTimeout(passo, 600);
        });

        espera = window.setTimeout(passo, 2200);
    }

    /* ------------------------------------------------------------
       Cartões: luz que segue o cursor e leve inclinação 3D
    ------------------------------------------------------------ */
    function iniciarCartoes() {
        var cartoes = Array.prototype.slice.call(document.querySelectorAll('[data-cartao]'));

        if (!cartoes.length || prefereMenosMovimento) return;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

        var atual = null;
        var ponteiroX = 0;
        var ponteiroY = 0;
        var pendente = false;

        function atualizar() {
            pendente = false;
            if (!atual) return;

            var caixa = atual.getBoundingClientRect();
            var px = (ponteiroX - caixa.left) / caixa.width;
            var py = (ponteiroY - caixa.top) / caixa.height;
            var giro = Number(atual.dataset.cartao) || 0;

            atual.style.setProperty('--mx', (px * 100).toFixed(2) + '%');
            atual.style.setProperty('--my', (py * 100).toFixed(2) + '%');

            if (giro) {
                atual.style.setProperty('--rx', ((0.5 - py) * giro).toFixed(2) + 'deg');
                atual.style.setProperty('--ry', ((px - 0.5) * giro).toFixed(2) + 'deg');
            }
        }

        cartoes.forEach(function (cartao) {
            cartao.addEventListener('pointermove', function (evento) {
                if (evento.pointerType !== 'mouse') return;

                atual = cartao;
                ponteiroX = evento.clientX;
                ponteiroY = evento.clientY;

                if (pendente) return;
                pendente = true;
                window.requestAnimationFrame(atualizar);
            });

            cartao.addEventListener('pointerleave', function () {
                if (atual === cartao) atual = null;
                cartao.style.removeProperty('--rx');
                cartao.style.removeProperty('--ry');
            });
        });
    }

    /* ------------------------------------------------------------
       Rolagem: progresso, parallax e volta ao topo
    ------------------------------------------------------------ */
    function iniciarRolagem() {
        var barra = document.querySelector('#progresso-barra');
        var botao = document.querySelector('#ao-topo');
        var cabecalho = document.querySelector('header');
        var perfil = document.querySelector('#perfil');
        var rodape = document.querySelector('footer');
        var pendente = false;

        function atualizar() {
            pendente = false;

            var y = window.scrollY || window.pageYOffset || 0;
            var tela = window.innerHeight;
            var rolavel = document.documentElement.scrollHeight - tela;

            if (barra) {
                var progresso = rolavel > 0 ? Math.min(1, Math.max(0, y / rolavel)) : 0;
                barra.style.transform = 'scaleX(' + progresso.toFixed(4) + ')';
            }

            if (botao) botao.classList.toggle('visivel', y > tela * 0.7);

            if (prefereMenosMovimento) return;

            // o fundo do topo desce mais devagar que o conteúdo: dá profundidade
            var avanco = Math.min(y, tela);
            if (cabecalho) cabecalho.style.setProperty('--parallax', (avanco * 0.2).toFixed(1) + 'px');
            if (perfil) perfil.style.setProperty('--deriva', (avanco * -0.07).toFixed(1) + 'px');

            if (rodape) {
                var caixa = rodape.getBoundingClientRect();
                if (caixa.top < tela && caixa.bottom > 0) {
                    var entrada = (tela - caixa.top) / (tela + caixa.height);
                    rodape.style.setProperty('--parallax', ((entrada - 0.5) * 80).toFixed(1) + 'px');
                }
            }
        }

        function agendar() {
            if (pendente) return;
            pendente = true;
            window.requestAnimationFrame(atualizar);
        }

        if (botao) {
            botao.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: prefereMenosMovimento ? 'auto' : 'smooth' });
            });
        }

        window.addEventListener('scroll', agendar, { passive: true });
        window.addEventListener('resize', agendar);
        atualizar();
    }

    function iniciar() {
        iniciarVento();
        iniciarRastro();
        iniciarMenu();
        iniciarNavegacao();
        iniciarTitulos();
        iniciarRevelacao();
        iniciarFiltro();
        iniciarEsteira();
        iniciarCartoes();
        iniciarPapeis();
        iniciarRolagem();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
