//funçao para voltar ao inicio da pagina ao clicar no titulo
function voltarParaInicio() {
    window.location.href = "index.html";
     }
// Abrindo ou criando o banco de dados IndexedDB
function abrirBancoDeDados() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BancoDeCodigos', 1);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            const objectStore = db.createObjectStore('codigos', { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex('titulo', 'titulo', { unique: false });
            objectStore.createIndex('conteudo', 'conteudo', { unique: false });
            objectStore.createIndex('imagem', 'imagem', { unique: false });
        };

        request.onsuccess = function (event) {
            resolve(event.target.result);
        };

        request.onerror = function (event) {
            reject('Erro ao abrir o banco de dados: ' + event.target.errorCode);
        };
    });
}

// Função para adicionar ou atualizar código no banco de dados
function adicionarCodigo(titulo, conteudo, imagem, id = null) {
    abrirBancoDeDados().then(db => {
        const transaction = db.transaction(['codigos'], 'readwrite');
        const objectStore = transaction.objectStore('codigos');

        const codigo = { titulo, conteudo, imagem };

        if (id) {
            // Atualiza o código existente
            codigo.id = id;
            const request = objectStore.put(codigo);
            request.onsuccess = function () {
                mostrarMensagemFeedback('Dados atualizados com sucesso!', 'success');
            };
            request.onerror = function () {
                mostrarMensagemFeedback('Erro ao atualizar dados.', 'danger');
            };
        } else {
            // Adiciona um novo código
            const request = objectStore.add(codigo);
            request.onsuccess = function () {
                mostrarMensagemFeedback('Dados adicionados com sucesso!', 'success');
            };
            request.onerror = function () {
                mostrarMensagemFeedback('Erro ao adicionar dados.', 'danger');
            };
        }
    });
}

// Função para carregar a imagem
function carregarImagem(event) {
    return new Promise((resolve, reject) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                resolve(e.target.result); // Base64 da imagem
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        } else {
            resolve(null); // Se nenhuma imagem for selecionada
        }
    });
}


// Função para exibir mensagens de feedback
function mostrarMensagemFeedback(mensagem, tipo) {
    const mensagemFeedback = document.getElementById('mensagemFeedback');
    mensagemFeedback.textContent = mensagem;
    mensagemFeedback.className = `alert alert-${tipo}`; // Define o tipo de alerta (success, danger, etc.)
    mensagemFeedback.classList.remove('d-none');

    setTimeout(() => {
        mensagemFeedback.classList.add('d-none'); // Esconde a mensagem após 1,5 segundos
    }, 1500);
}

// Função para excluir todos os dados do IndexedDB
function excluirTodosOsDados() {
    console.log("Confirmação recebida, iniciando exclusão dos dados...");

    abrirBancoDeDados().then(db => {
        const transaction = db.transaction(['codigos'], 'readwrite');
        const objectStore = transaction.objectStore('codigos');

        const request = objectStore.clear();
        request.onsuccess = function () {
            console.log("Dados excluídos com sucesso.");
            mostrarMensagemFeedback('Todos os dados foram excluídos com sucesso!', 'success');

            // Limpa a exibição dos itens
            document.getElementById('resultadoPesquisa').innerHTML = '';
        };
        request.onerror = function (event) {
            console.error("Erro ao excluir os dados: ", event.target.error);
            mostrarMensagemFeedback('Erro ao excluir todos os dados.', 'danger');
        };
    }).catch(error => {
        console.error("Erro ao abrir o banco de dados: ", error);
    });
}

// Adiciona evento de clique no botão para abrir o modal de confirmação
document.getElementById('excluirTudo').addEventListener('click', () => {
    const modalConfirmacao = new bootstrap.Modal(document.getElementById('modalConfirmacao'));
    modalConfirmacao.show();
});

// Adiciona evento de clique no botão de confirmação dentro do modal
document.getElementById('confirmarExclusao').addEventListener('click', () => {
    excluirTodosOsDados();

    // Fecha o modal após a exclusão
    const modalConfirmacao = bootstrap.Modal.getInstance(document.getElementById('modalConfirmacao'));
    modalConfirmacao.hide();
});



// Função para excluir um código
function excluirCodigo(id) {
    abrirBancoDeDados().then(db => {
        const transaction = db.transaction(['codigos'], 'readwrite');
        const objectStore = transaction.objectStore('codigos');

        const request = objectStore.delete(id);
        request.onsuccess = function () {
            mostrarMensagemFeedback('Código excluído com sucesso!', 'success');

            // Remove o item da exibição usando o ID do código
            const elemento = document.getElementById(`codigo-${id}`);
            if (elemento) {
                elemento.remove();
            }
        };
        request.onerror = function () {
            mostrarMensagemFeedback('Erro ao excluir o código.', 'danger');
        };
    });
}



// Função para carregar o código no formulário para edição
function carregarCodigoParaEdicao(id) {
    abrirBancoDeDados().then(db => {
        const transaction = db.transaction(['codigos'], 'readonly');
        const objectStore = transaction.objectStore('codigos');
        const request = objectStore.get(id);

        request.onsuccess = function (event) {
            const codigo = event.target.result;
            if (codigo) {
                document.getElementById('tituloCodigo').value = codigo.titulo;
                document.getElementById('conteudoCodigo').value = codigo.conteudo;
                formAdicionar.setAttribute('data-id', codigo.id); // Armazena o ID para a edição
                mostrarMensagemFeedback('Código carregado para edição.', 'info');

                // Garante que o formulário seja exibido ao editar
                document.getElementById('formAdicionar').classList.remove('d-none');

                // Limpa a barra de pesquisa e esconde os resultados da pesquisa
                document.getElementById('barraPesquisa').value = '';
                document.getElementById('resultadoPesquisa').innerHTML = '';

                // Coloca o foco no campo de descrição
                document.getElementById('conteudoCodigo').focus();
            }
        };

        request.onerror = function () {
            mostrarMensagemFeedback('Erro ao carregar código para edição.', 'danger');
        };
    });
}



// Função para pesquisar códigos no banco de dados
// function pesquisarCodigosIndexedDB(termo) {
//     return new Promise((resolve, reject) => {
//         abrirBancoDeDados().then(db => {
//             const transaction = db.transaction(['codigos'], 'readonly');
//             const objectStore = transaction.objectStore('codigos');

//             const codigosEncontrados = [];

//             objectStore.openCursor().onsuccess = function (event) {
//                 const cursor = event.target.result;
//                 if (cursor) {
//                     const { titulo, conteudo, imagem, id } = cursor.value;
//                     if (titulo.toLowerCase().includes(termo.toLowerCase()) || conteudo.toLowerCase().includes(termo.toLowerCase())) {
//                         codigosEncontrados.push(cursor.value);
//                     }
//                     cursor.continue();
//                 } else {
//                     resolve(codigosEncontrados);
//                 }
//             };

//             objectStore.openCursor().onerror = function (event) {
//                 reject('Erro ao pesquisar códigos: ' + event.target.errorCode);
//             };
//         });
//     });
// }
//inicio nova funçao para pesquisar no banco de dados
// Função para remover acentos e transformar em letras minúsculas
function removerAcentos(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Função para pesquisar códigos no banco de dados
function pesquisarCodigosIndexedDB(termo) {
    return new Promise((resolve, reject) => {
        abrirBancoDeDados().then(db => {
            const transaction = db.transaction(['codigos'], 'readonly');
            const objectStore = transaction.objectStore('codigos');

            const codigosEncontrados = [];

            const termosBusca = removerAcentos(termo).split(' '); // Quebra o termo em palavras e remove acentuação

            objectStore.openCursor().onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    const { titulo, conteudo } = cursor.value;

                    const tituloNormalizado = removerAcentos(titulo);
                    const conteudoNormalizado = removerAcentos(conteudo);

                    // Verifica se todas as palavras da busca estão presentes no título ou no conteúdo
                    const corresponde = termosBusca.every(palavra =>
                        tituloNormalizado.includes(palavra) || conteudoNormalizado.includes(palavra)
                    );

                    if (corresponde) {
                        codigosEncontrados.push(cursor.value);
                    }

                    cursor.continue();
                } else {
                    resolve(codigosEncontrados);
                }
            };

            objectStore.openCursor().onerror = function (event) {
                reject('Erro ao pesquisar códigos: ' + event.target.errorCode);
            };
        });
    });
}

//fim nova funçao para pesquisar no banco de dados

// Função para mostrar os resultados e configurar a expansão dos itens
function mostrarResultados(resultados) {
    const resultadoPesquisa = document.getElementById('resultadoPesquisa');
    resultadoPesquisa.innerHTML = ''; // Limpa resultados anteriores

    resultados.forEach(codigo => {
        const divCodigo = document.createElement('div');
        divCodigo.classList.add('col-12', 'col-md-6', 'col-lg-3', 'resultado-item'); // Adiciona a classe inicial
        divCodigo.id = `codigo-${codigo.id}`; // Define um ID único baseado no código

        divCodigo.innerHTML = `
            ${codigo.imagem ? `<img src="${codigo.imagem}" alt="${codigo.titulo}">` : ''}
            <div>
                <h3>${codigo.titulo}</h3>
                <pre class="conteudo-pre">${codigo.conteudo}</pre>
                <div class="botoes-container">
                    <button class="btn btn-secondary fas fa-edit" onclick="carregarCodigoParaEdicao(${codigo.id})">Editar</button>
                    <button class="btn btn-danger fas fa-trash-alt" onclick="excluirCodigo(${codigo.id})">Excluir</button>
                </div>
            </div>
        `;

        // Adiciona evento de clique para expandir e recolher
        divCodigo.addEventListener('click', function () {
            if (divCodigo.classList.contains('expanded')) {
                // Se já está expandido, recolhe o item para voltar a ativar e so descomentar a linha abaixo
                //divCodigo.classList.remove('expanded');
            } else {
                // Recolher todos os outros itens
                document.querySelectorAll('.resultado-item.expanded').forEach(item => {
                    item.classList.remove('expanded');
                });
                //inicio do novo evento clicar fora recolher itens
                // Adiciona evento de clique fora do item para recolher todos os itens
                document.addEventListener('click', (event) => {
                    const isExpandedItem = event.target.closest('.resultado-item.expanded');

                    if (!isExpandedItem) {
                        // Se o clique não foi dentro de um item expandido, recolhe todos
                        document.querySelectorAll('.resultado-item.expanded').forEach(item => {
                            item.classList.remove('expanded');
                        });
                    }
                });
                //finao do evento clicar fora recolher itens
                // Expandir o item clicado
                divCodigo.classList.add('expanded');
            }
        });

        resultadoPesquisa.appendChild(divCodigo);
    });
}





// Manipulando o formulário para adicionar ou editar códigos
const formAdicionar = document.getElementById('formAdicionar');
formAdicionar.addEventListener('submit', async (event) => {
    event.preventDefault(); // Evita o recarregamento da página
    const titulo = document.getElementById('tituloCodigo').value;
    const conteudo = document.getElementById('conteudoCodigo').value;
    const imagem = await carregarImagem({ target: document.getElementById('imagemCodigo') });
    const id = formAdicionar.getAttribute('data-id'); // Pega o ID para edição, se houver

    adicionarCodigo(titulo, conteudo, imagem, id ? Number(id) : null);

    // Limpa o formulário e remove o ID para futuras adições
    formAdicionar.reset();
    document.getElementById('imagemCodigo').value = '';
    formAdicionar.removeAttribute('data-id');
});

// Função para exportar dados como JSON
function exportarDados() {
    abrirBancoDeDados().then(db => {
        const transaction = db.transaction(['codigos'], 'readonly');
        const objectStore = transaction.objectStore('codigos');
        const request = objectStore.getAll();

        request.onsuccess = function (event) {
            const codigos = event.target.result;
            const json = JSON.stringify(codigos, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'backup_codigos.json';
            a.click();

            URL.revokeObjectURL(url);
            mostrarMensagemFeedback('Backup exportado com sucesso!', 'success');
        };

        request.onerror = function () {
            mostrarMensagemFeedback('Erro ao exportar dados.', 'danger');
        };
    });
}

// Função para importar dados de um arquivo JSON
function importarDados(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const json = e.target.result;
            const dadosImportados = JSON.parse(json);

            abrirBancoDeDados().then(db => {
                const transaction = db.transaction(['codigos'], 'readwrite');
                const objectStore = transaction.objectStore('codigos');

                dadosImportados.forEach(codigo => {
                    const request = objectStore.put(codigo); // 'put' atualiza ou insere
                    request.onsuccess = function () {
                        mostrarMensagemFeedback('Dados importados com sucesso!', 'success');
                    };
                    request.onerror = function () {
                        mostrarMensagemFeedback('Erro ao importar dados.', 'danger');
                    };
                });
            });
        };
        reader.readAsText(file);
    }
}

// Manipulação dos botões de backup e restauração
document.getElementById('exportarDados').addEventListener('click', exportarDados);
document.getElementById('importarDados').addEventListener('click', () => {
    document.getElementById('inputImportarDados').click(); // Simula o clique no input de arquivo
});
document.getElementById('inputImportarDados').addEventListener('change', importarDados);


// Função de pesquisa ao digitar na barra de pesquisa
document.getElementById('barraPesquisa').addEventListener('input', async (event) => {
    const termo = event.target.value;
    const formAdicionar = document.getElementById('formAdicionar');

    if (termo) {
        formAdicionar.classList.add('d-none'); // Oculta o formulário se houver pesquisa
        const resultados = await pesquisarCodigosIndexedDB(termo);
        mostrarResultados(resultados);
    } else {
        formAdicionar.classList.remove('d-none'); // Exibe o formulário se a barra estiver vazia
        document.getElementById('resultadoPesquisa').innerHTML = ''; // Limpa resultados se a barra estiver vazia
    }
});


// Selecionar a barra de pesquisa e o formulário
const barraPesquisa = document.getElementById('barraPesquisa');
const formaAdicionar = document.getElementById('formAdicionar');

// Função para verificar se há texto na barra de pesquisa
function verificarBarraDePesquisa() {
    if (barraPesquisa.value.trim() !== '') {
        formAdicionar.classList.add('d-none'); // Esconder o formulário
    } else {
        formAdicionar.classList.remove('d-none'); // Mostrar o formulário
    }
}

// Adicionar um listener para monitorar mudanças na barra de pesquisa
barraPesquisa.addEventListener('input', verificarBarraDePesquisa);

// Função para alternar entre os temas
function aplicarTema(tema) {
    if (tema === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkTheme').checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('lightTheme').checked = true;
    }
    localStorage.setItem('temaEscolhido', tema); // Salva o tema no localStorage
}

// Carregar o tema salvo ao carregar a página
window.onload = function () {
    const temaSalvo = localStorage.getItem('temaEscolhido') || 'light';
    aplicarTema(temaSalvo);
};

// Alternar visibilidade do painel de configuração
document.getElementById('configButton').addEventListener('click', function () {
    const configPanel = document.getElementById('configPanel');
    configPanel.classList.toggle('d-none'); // Mostra ou esconde o painel
});



// Aplicar o tema ao clicar nas opções
document.getElementById('lightTheme').addEventListener('change', function () {
    aplicarTema('light');
});

document.getElementById('darkTheme').addEventListener('change', function () {
    aplicarTema('dark');
});

// Função para limpar todos os campos do formulário e colocar o foco no campo de título
function limparFormulario() {
    // Limpa todos os campos do formulário
    formAdicionar.reset();

    // limpa a barra de pesquisa e esconde os resultados da pesquisa
    document.getElementById('barraPesquisa').value = '';
    document.getElementById('resultadoPesquisa').innerHTML = '';

    // Remove qualquer dado de edição em andamento (se houver)
    formAdicionar.removeAttribute('data-id');

    // Coloca o foco no campo de título
    document.getElementById('tituloCodigo').focus();
    
    // Exibe uma mensagem de feedback informando que o formulário foi limpo
    mostrarMensagemFeedback('Formulário limpo com sucesso!', 'info');

}

// Adiciona o evento de clique ao botão de limpar
document.getElementById('limparFormulario').addEventListener('click', limparFormulario);