const iconesAtributos = {
    'altura': '📏',
    'peso': '🪨',
    'comprimento': '🦖',
    'velocidade': '⚡',
    'força': '⚔️',
    'ataque': '⚔️',
    'defesa': '🛡️',
    'inteligência': '🧠',
    'agilidade': '🌪️'
};

let gameState = {
    p1: { name: '', deck: [] },
    p2: { name: '', deck: [] },
    turn: 1, 
    pool: [], 
    currentCardP1: null,
    currentCardP2: null,
    isResolving: false 
};

const screens = {
    setup: document.getElementById('setup-screen'),
    game: document.getElementById('game-screen'),
    win: document.getElementById('win-screen')
};

// Adiciona o efeito de "pulso" sempre que o jogador digita uma letra
['player1-name', 'player2-name'].forEach(id => {
    const inputEl = document.getElementById(id);
    if (inputEl) {
        inputEl.addEventListener('input', () => {
            // Remove e adiciona a classe rapidinho para reiniciar a animação
            inputEl.classList.remove('input-typing');
            void inputEl.offsetWidth; // Truque do JS para forçar o recarregamento do CSS
            inputEl.classList.add('input-typing');
        });
    }
});

// Ao clicar em Começar Jogo com animação radical
document.getElementById('btn-start').addEventListener('click', async () => {
    const name1 = document.getElementById('player1-name').value;
    const name2 = document.getElementById('player2-name').value;
    const count = parseInt(document.getElementById('card-count').value);
    const mode = document.getElementById('game-mode').value;
    const errorMsg = document.getElementById('setup-error');
    const btnStart = document.getElementById('btn-start');

    if (!name1 || !name2) return errorMsg.innerText = "Preencha os nomes dos jogadores.";
    if (count % 2 !== 0 || count < 2) return errorMsg.innerText = "O número de cartas deve ser par e maior que 0.";

    errorMsg.innerText = "Preparando a arena...";
    btnStart.disabled = true; // Impede que o jogador clique duas vezes
    
    try {
        const url = `http://localhost:3000/dinos/${mode}/${count}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Erro ao buscar dinos da API.');
        
        const dinos = await response.json();
        
        if (dinos.length < count) {
             btnStart.disabled = false;
             return errorMsg.innerText = `Só há ${dinos.length} dinos no banco. Reduza o número de cartas.`;
        }

        gameState.p1.name = name1;
        gameState.p2.name = name2;
        dinos.forEach((dino, index) => {
            if (index % 2 === 0) gameState.p1.deck.push(dino);
            else gameState.p2.deck.push(dino);
        });

        document.getElementById('name-p1').innerHTML = `${gameState.p1.name} <span class="crown">👑</span>`;
        document.getElementById('name-p2').innerHTML = `<span class="crown">👑</span> ${gameState.p2.name}`;

        // --- INÍCIO DA ANIMAÇÃO ÉPICA ---
        const setupModal = document.querySelector('.setup-modal');
        setupModal.classList.add('modal-earthquake'); // Inicia o terremoto
        btnStart.innerText = "RUGIDO!!!"; // Muda o texto do botão
        btnStart.style.backgroundColor = "#7f1d1d"; // Fica um vermelho super escuro

        // Espera 1.2 segundos de terremoto, depois explode a tela
        setTimeout(() => {
            setupModal.classList.remove('modal-earthquake');
            screens.setup.classList.add('setup-exit'); // Dá o zoom in
            
            // Espera a animação de saída terminar para renderizar o jogo
            setTimeout(() => {
                startGame();
                
                // Limpa as classes para caso o jogador queira jogar de novo depois
                screens.setup.classList.remove('setup-exit');
                btnStart.innerText = "INICIAR BATALHA";
                btnStart.disabled = false;
                btnStart.style.backgroundColor = "";
            }, 600); 
        }, 1200); 

    } catch (err) {
        btnStart.disabled = false;
        errorMsg.innerText = "Erro ao conectar com o servidor. Verifique se a API está rodando.";
        console.error(err);
    }
});

function startGame() {
    screens.setup.classList.remove('active');
    screens.game.classList.add('active');
    renderRound();
    // Adicione isso logo após o jogador clicar em Iniciar
    const rain = document.getElementById('dino-rain-container');
    if (rain) {
        rain.remove(); // Para a chuva quando o jogo começa!
    }
}

function renderRound() {
    updateTugOfWar()
    gameState.isResolving = false;
    
    // Zera o botão e exibe o VS
    const nextBtn = document.getElementById('btn-next-turn');
    if (nextBtn) {
        nextBtn.classList.remove('show', 'hidden'); 
    }
    
    const vsBadge = document.getElementById('vs-badge');
    if (vsBadge) {
        vsBadge.style.display = 'block';
    }
    
    const countP1 = gameState.p1.deck.length;
    const countP2 = gameState.p2.deck.length;

    // Atualiza Placar
    document.getElementById('count-p1').innerText = countP1;
    document.getElementById('count-p2').innerText = countP2;

    // Coroa e Destaque
    document.getElementById('area-p1').classList.remove('winning');
    document.getElementById('area-p2').classList.remove('winning');

    if (countP1 > countP2) {
        document.getElementById('area-p1').classList.add('winning');
    } else if (countP2 > countP1) {
        document.getElementById('area-p2').classList.add('winning');
    }

    // Pool de Empate
    if (gameState.pool.length > 0) {
        document.getElementById('pool-status').classList.remove('hidden');
        document.getElementById('pool-count').innerText = gameState.pool.length;
    } else {
        document.getElementById('pool-status').classList.add('hidden');
    }

    // Fim de Jogo
    if (countP1 === 0) return endGame(gameState.p2.name);
    if (countP2 === 0) return endGame(gameState.p1.name);

    gameState.currentCardP1 = gameState.p1.deck[0];
    gameState.currentCardP2 = gameState.p2.deck[0];

    // Número Mágico
    gameState.currentCardP1.numero_magico = Math.floor(Math.random() * 10) + 1;
    gameState.currentCardP2.numero_magico = Math.floor(Math.random() * 10) + 1;

    // Cabeçalho
    const activeName = gameState.turn === 1 ? gameState.p1.name : gameState.p2.name;
    document.getElementById('turn-indicator').innerText = `Vez de ${activeName}`;
    document.getElementById('game-status').innerText = "Escolha um atributo para desafiar!";
    document.getElementById('game-status').style.color = "var(--accent-primary)";

    const slotP1 = document.getElementById('card-p1');
    const slotP2 = document.getElementById('card-p2');

    slotP1.innerHTML = createCardHTML(gameState.currentCardP1, gameState.turn === 1, 'p1');
    slotP2.innerHTML = createCardHTML(gameState.currentCardP2, gameState.turn === 2, 'p2');

    if (gameState.turn === 1) attachClickEvents(slotP1);
    if (gameState.turn === 2) attachClickEvents(slotP2);
}

function createCardHTML(dino, isActive, playerId) {
    const imgUrl = dino.imagem || 'https://via.placeholder.com/260x140?text=Sem+Imagem';
    const flippedClass = isActive ? 'flipped' : ''; 
    
    return `
        <div class="card-scene">
            <div class="card-inner ${flippedClass}" id="inner-${playerId}">
                <div class="card-back"></div>
                <div class="card-front">
                    <h4>${dino.nome}</h4>
                    <div class="img-container"><img src="${imgUrl}" alt="${dino.nome}"></div>
                    <div class="type-badge">${dino.tipo}</div>
                    <ul class="attributes">
                        <li data-attr="altura"><span class="stat-icon">📏</span> Altura <span>${dino.altura}m</span></li>
                        <li data-attr="comprimento"><span class="stat-icon">🦖</span> Compr. <span>${dino.comprimento}m</span></li>
                        <li data-attr="peso"><span class="stat-icon">🪨</span> Peso <span>${dino.peso}kg</span></li>
                        <li data-attr="velocidade"><span class="stat-icon">⚡</span> Velocidade <span>${dino.velocidade}</span></li>
                        <li data-attr="agilidade"><span class="stat-icon">🌪️</span> Agilidade <span>${dino.agilidade}</span></li>
                        <li data-attr="longevidade"><span class="stat-icon">⏳</span> Longevidade <span>${dino.longevidade}</span></li>
                        <li data-attr="numero_magico"><span class="stat-icon">✨</span> Nº Mágico <span>${dino.numero_magico}</span></li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function attachClickEvents(slotElement) {
    const items = slotElement.querySelectorAll('.attributes li');
    items.forEach(item => {
        item.addEventListener('click', () => {
            if (!gameState.isResolving) resolveHand(item.getAttribute('data-attr'));
        });
    });
}

function resolveHand(attributeStr) {
    gameState.isResolving = true; 

    document.getElementById('inner-p1').classList.add('flipped');
    document.getElementById('inner-p2').classList.add('flipped');

    document.querySelectorAll(`[data-attr="${attributeStr}"]`).forEach(el => {
        el.style.backgroundColor = 'var(--accent-primary)';
        el.style.color = 'var(--bg-main)';
        el.style.paddingLeft = '25px';
    });

    const val1 = parseFloat(gameState.currentCardP1[attributeStr]);
    const val2 = parseFloat(gameState.currentCardP2[attributeStr]);
    const statusEl = document.getElementById('game-status');

    const card1 = gameState.p1.deck.shift();
    const card2 = gameState.p2.deck.shift();

    setTimeout(() => {
        if (val1 > val2) {
            statusEl.innerText = `${gameState.p1.name} Venceu a Mão! (${val1} > ${val2})`;
            statusEl.style.color = "var(--accent-primary)";
            gameState.p1.deck.push(card1, card2, ...gameState.pool);
            gameState.pool = [];
            gameState.turn = 1;
        } 
        else if (val2 > val1) {
            statusEl.innerText = `${gameState.p2.name} Venceu a Mão! (${val2} > ${val1})`;
            statusEl.style.color = "var(--accent-primary)";
            gameState.p2.deck.push(card1, card2, ...gameState.pool);
            gameState.pool = [];
            gameState.turn = 2;
        } 
        else {
            statusEl.innerText = `Empate! As cartas vão para a mesa. (${val1} = ${val2})`;
            statusEl.style.color = "#fbbf24"; 
            gameState.pool.push(card1, card2);
        }

        const vsBadge = document.getElementById('vs-badge');
        if (vsBadge) {
            vsBadge.style.display = 'none';
        }

        const nextBtn = document.getElementById('btn-next-turn');
        if (nextBtn) {
            nextBtn.classList.remove('hidden'); 
            nextBtn.classList.add('show');
            
            // Nova lógica de transição suave
            nextBtn.onclick = () => {
                // 1. Esconde o botão imediatamente
                nextBtn.classList.remove('show'); 
                
                // 2. Adiciona a classe 'exit' nas cartas atuais para elas sumirem
                document.querySelectorAll('.card-scene').forEach(card => {
                    card.classList.add('exit');
                });
                
                // 3. Espera 400ms (o tempo da animação acabar) e só então renderiza a nova rodada
                setTimeout(() => {
                    renderRound();
                }, 400); 
            };
        }
    }, 600); // <--- O QUE FALTAVA: Fechamento do setTimeout e tempo de 600ms
} // <--- O QUE FALTAVA: Fechamento da função resolveHand

// Agora sim a função endGame fica separadinha e correta
// Função de fim de jogo atualizada
function endGame(winnerName) {
    screens.game.classList.remove('active');
    screens.win.classList.add('active');
    document.getElementById('winner-name').innerText = `${winnerName} Venceu!`;
    
    // Dispara a chuva de confetes
    createConfetti();
}

// Criador de confetes
function createConfetti() {
    const colors = ['#10b981', '#fbbf24', '#ef4444', '#3b82f6', '#a855f7']; // Cores vivas
    
    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        
        // Posição horizontal aleatória
        confetti.style.left = Math.random() * 100 + 'vw';
        
        // Cor aleatória da nossa lista
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Tamanho levemente aleatório
        const size = (Math.random() * 10 + 5) + 'px';
        confetti.style.width = size;
        confetti.style.height = size;
        
        // Tempo e velocidade de queda aleatórios para dar realismo
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        
        document.body.appendChild(confetti);
    }
}

// Atualiza a barra de cabo de guerra
function updateTugOfWar() {
    const p1Cards = gameState.p1.deck.length;
    const p2Cards = gameState.p2.deck.length;
    
    // Total de cartas no jogo (ignorando o empate temporário da mesa)
    const totalInDecks = p1Cards + p2Cards; 
    
    if (totalInDecks === 0) return;

    // Calcula a porcentagem
    const p1Percent = (p1Cards / totalInDecks) * 100;
    const p2Percent = (p2Cards / totalInDecks) * 100;

    // Atualiza a largura das barras
    document.getElementById('bar-p1').style.width = `${p1Percent}%`;
    document.getElementById('bar-p2').style.width = `${p2Percent}%`;

    // Atualiza os números de cartas nos cantos
    document.getElementById('score-p1').innerText = p1Cards;
    document.getElementById('score-p2').innerText = p2Cards;
}

function iniciarChuvaDeDinos() {
    // Cria o contêiner da chuva e adiciona ao body
    const rainContainer = document.createElement('div');
    rainContainer.id = 'dino-rain-container';
    document.body.appendChild(rainContainer);

    const dinos = ['🦖', '🦕']; // Emojis que vão chover
    const numDinos = 30; // Quantidade de dinossauros caindo ao mesmo tempo

    for (let i = 0; i < numDinos; i++) {
        const dino = document.createElement('div');
        dino.classList.add('dino-drop');
        
        // Sorteia entre o T-Rex e o Braquiossauro
        dino.innerText = dinos[Math.floor(Math.random() * dinos.length)];
        
        // Posição horizontal aleatória (0% a 100% da tela)
        dino.style.left = Math.random() * 100 + 'vw';
        
        // Tamanho aleatório (entre 20px e 50px)
        const size = Math.random() * 30 + 20; 
        dino.style.fontSize = size + 'px';
        
        // Tempo de queda aleatório (entre 4s e 10s) para não caírem juntos
        const fallDuration = Math.random() * 6 + 4; 
        
        // Tempo do giro aleatório (entre 2s e 5s)
        const spinDuration = Math.random() * 3 + 2; 
        
        // Atraso aleatório para iniciar a queda (para a chuva ser constante)
        const delay = Math.random() * 5; 
        
        // Aplica os tempos no CSS do elemento
        dino.style.animationDuration = `${fallDuration}s, ${spinDuration}s`;
        dino.style.animationDelay = `${delay}s, ${delay}s`;
        
        // Se quiser que alguns girem no sentido contrário:
        if (Math.random() > 0.5) {
            dino.style.animationDirection = 'normal, reverse';
        }
        
        rainContainer.appendChild(dino);
    }
}

// Chame a função quando o jogo carregar
// Se você já tem um window.onload, coloque apenas a chamada iniciarChuvaDeDinos(); dentro dele.
iniciarChuvaDeDinos();


/* =========================================
   DINOSSAURO SORRATEIRO (Girando antes de aterrissar)
   ========================================= */

function iniciarDinoSorrateiro() {
    const dinoElement = document.querySelector('.sneaky-dino-head');
    if (!dinoElement) return;

    const paredes = ['top', 'bottom', 'left', 'right'];
    const listaDinos = ['🦖', '🦕', '🦣', '🐊'];

    function espiar() {
        // 1. Reseta o elemento
        dinoElement.style.transition = 'none';
        dinoElement.style.opacity = '0';
        dinoElement.style.top = 'auto';
        dinoElement.style.bottom = 'auto';
        dinoElement.style.left = 'auto';
        dinoElement.style.right = 'auto';

        // 2. Sorteia o dino
        const dinoSorteado = listaDinos[Math.floor(Math.random() * listaDinos.length)];
        dinoElement.innerText = dinoSorteado;

        // 3. Sorteia a parede e a posição
        const paredeSorteada = paredes[Math.floor(Math.random() * paredes.length)];
        const posicaoAleatoria = Math.floor(Math.random() * 60) + 20; 

        // --- MÁGICA DO GIRO ---
        // Sorteia de 1 a 3 voltas completas (360, 720 ou 1080 graus)
        const voltas = (Math.floor(Math.random() * 3) + 1) * 360; 
        // Sorteia se vai girar para a direita ou esquerda
        const direcao = Math.random() > 0.5 ? 1 : -1; 
        const giro = voltas * direcao;

        let transformEscondido, transformVisivel;

        // 4. Aplica o ângulo de giro EXTRA na posição escondida
        if (paredeSorteada === 'bottom') {
            dinoElement.style.bottom = '-50px';
            dinoElement.style.left = posicaoAleatoria + '%';
            // Ele começa girado e termina no ângulo 0
            transformEscondido = `translateY(100%) rotate(${0 + giro}deg)`; 
            transformVisivel = `translateY(20px) rotate(0deg)`;
            
        } else if (paredeSorteada === 'top') {
            dinoElement.style.top = '-50px';
            dinoElement.style.left = posicaoAleatoria + '%';
            // Termina no 180, então começa no 180 + giro
            transformEscondido = `translateY(-100%) rotate(${180 + giro}deg)`; 
            transformVisivel = `translateY(-20px) rotate(180deg)`;
            
        } else if (paredeSorteada === 'left') {
            dinoElement.style.left = '-50px';
            dinoElement.style.top = posicaoAleatoria + '%';
            // Termina no 90, então começa no 90 + giro
            transformEscondido = `translateX(-100%) rotate(${90 + giro}deg)`; 
            transformVisivel = `translateX(-20px) rotate(90deg)`;
            
        } else if (paredeSorteada === 'right') {
            dinoElement.style.right = '-50px';
            dinoElement.style.top = posicaoAleatoria + '%';
            // Termina no -90, então começa no -90 + giro
            transformEscondido = `translateX(100%) rotate(${-90 + giro}deg)`; 
            transformVisivel = `translateX(20px) rotate(-90deg)`;
        }

        // Prepara a posição inicial (escondida e muito girada)
        dinoElement.style.transform = transformEscondido;

        // Força o navegador a registrar
        void dinoElement.offsetWidth;

        // 5. Entra em cena! O CSS faz o trabalho de "desenrolar" o giro
        dinoElement.style.transition = 'transform 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 1.5s ease';
        dinoElement.style.opacity = '1';
        dinoElement.style.transform = transformVisivel;

        // 6. Esconde o dinossauro (ele recua girando de volta para a sombra)
        setTimeout(() => {
            dinoElement.style.opacity = '0';
            dinoElement.style.transform = transformEscondido;
        }, 3000);

        // 7. Prepara o próximo
        const proximoSusto = Math.random() * 4000 + 4000;
        setTimeout(espiar, proximoSusto);
    }

    setTimeout(espiar, 2000);
}

iniciarDinoSorrateiro();