export class Diretorio {
    /**
     * @type {String}
     */
    caminhoCompletoDiretorio = ''
    /**
     * @type {String}
     */
    nome = ''

    /**
     * @type {[Arquivo]}
     */
    arquivos = [];

    /**
     * @type {[Diretorio]}
     */
    diretorios = [];

    /**
     * @type {RegistradorEvento}
     */
    gerenciadorEventos = new RegistradorEvento(this);

    indexSistema = ''

    constructor(caminho_diretorio) {
        this.caminhoCompletoDiretorio = caminho_diretorio;
        this.nome = path.basename(caminho_diretorio);
        this.lerLinks();
        this.carregarPropriedades();
        this.cadastrarListeners();
    }

    cadastrarListeners() {

        this.gerenciadorEventos.onArquivoCriado((nome_arquivo) => {
            this.log(`Foi criado um arquivo em min com o nome de ${nome_arquivo}`);
            // Insere o novo arquivo no cache
            this.addNovoArquivo(nome_arquivo);
        })

        this.gerenciadorEventos.onArquivoDeletado((nome_arquivo) => {
            this.log(`Foi deletado o arquivo ${nome_arquivo}`);

            this.arquivos = this.arquivos.filter(arqObj => arqObj.nome_arquivo != nome_arquivo);
        })

        this.gerenciadorEventos.onArquivoRenomeado((nome_antigo, novo_nome) => {
            this.log(`O arquivo ${nome_antigo} foi renomeado para ${novo_nome}`);

            let arquivoRenomeado = this.arquivos.find(arqObj => arqObj.nomeArquivo == nome_antigo);
            arquivoRenomeado.atualizarNome(novo_nome);
        })

        this.gerenciadorEventos.onDiretorioCriado((nome_diretorio) => {
            this.log(`Foi criado um novo diretorio com o nome ${nome_diretorio}`);

            this.addNovoDiretorio(nome_diretorio)
        })

        this.gerenciadorEventos.onDiretorioDeletado((nome_diretorio) => {
            this.log(`O diretorio ${nome_diretorio} foi deletado`);

            this.diretorios = this.diretorios.filter(dirObj => dirObj.nome != nome_diretorio);
        })

        this.gerenciadorEventos.onDiretorioRenomeado((nome_antigo, nome_novo) => {
            this.log(`O diretorio ${nome_antigo} foi renomeado para ${nome_novo}`);

            let diretorioRenomeado = this.diretorios.find(dirObj => dirObj.nome == nome_antigo);
            diretorioRenomeado.atualizarNome(nome_novo);
        })
    }

    lerLinks() {
        let linksExistentes = lerDiretorio(this.caminhoCompletoDiretorio)

        if (linksExistentes.encontrados == 0) {
            this.log(`Não existem links no diretorio ${this.caminhoCompletoDiretorio}`);
            return;
        }

        this.log(`Lendo links do diretorio ${this.caminhoCompletoDiretorio}`);
        this.log(`Arquivos: ${linksExistentes.arquivos.length}, diretorios: ${linksExistentes.diretorios.length}`);

        if (linksExistentes.diretorios.length != 0) {
            linksExistentes.diretorios.forEach(objDiretorio => {
                this.addNovoDiretorio(objDiretorio.nome);
            })
        }

        if (linksExistentes.arquivos.length != 0) {

            linksExistentes.arquivos.forEach(arquivoObj => {
                this.addNovoArquivo(arquivoObj.nomeExtensao)
            })
        }

    }

    carregarPropriedades() {
        let linkPropriedades = fs.statSync(this.caminhoCompletoDiretorio);
        this.indexSistema = `${linkPropriedades.ino}${linkPropriedades.dev}`;
    }

    addNovoArquivo(nome_arquivo) {
        let caminhoArquivo = `${this.caminhoCompletoDiretorio}\\${nome_arquivo}`;
        let novoArquivo = new Arquivo(caminhoArquivo, this);

        this.arquivos.push(novoArquivo);
    }

    addNovoDiretorio(nome_diretorio) {
        let caminhoDiretorio = `${this.caminhoCompletoDiretorio}\\${nome_diretorio}`;
        let novoDiretorio = new Diretorio(caminhoDiretorio);

        this.diretorios.push(novoDiretorio)
    }

    atualizarDiretorioPai(novo_caminho) {
        let novoCaminho = `${novo_caminho}\\${this.nome}`;

        this.caminhoCompletoDiretorio = novoCaminho;
        this.log(`Alterando meu novo caminho para ${novoCaminho}`);
        this.caminhoCompletoDiretorio = novoCaminho;

        // Atualizar outros diretorios e arquivos dentro desse diretorio também!
        for (const arquivoExistente of this.arquivos) {
            arquivoExistente.atualizarDiretorioPai(this.caminhoCompletoDiretorio);
        }

        for (const diretorioExistente of this.diretorios) {
            diretorioExistente.atualizarDiretorioPai(this.caminhoCompletoDiretorio);
        }

        this.carregarPropriedades();
    }

    atualizarNome(novo_nome) {
        let novoNome = novo_nome;
        let novoCaminho = `${path.dirname(this.caminhoCompletoDiretorio)}\\${novo_nome}`;

        this.nome = novoNome;
        this.caminhoCompletoDiretorio = novoCaminho

        // Atualizar os outros diretorios e arquivos dentro desse diretorio sendo renomeado pelo nome
        for (const arquivoExistente of this.arquivos) {
            arquivoExistente.atualizarDiretorioPai(this.caminhoCompletoDiretorio);
        }

        for (const diretorioExistente of this.diretorios) {
            diretorioExistente.atualizarDiretorioPai(this.caminhoCompletoDiretorio);
        }

        this.carregarPropriedades();
    }

    /**
     * 
     * @param {String} nomeLink 
     * @returns {'arquivo' | 'diretorio' | ''}
     */
    getTipoLink(nomeLink, indexSistema) {
        let arquivoObj = this.arquivos.find(arqObj => {
            let existePorNome = arqObj.nomeArquivo == nomeLink;
            let existePorIndex = arqObj.indexSistema == indexSistema;

            if (nomeLink != undefined && indexSistema == undefined) {
                return existePorNome
            } else if (nomeLink == undefined && indexSistema != undefined) {
                return existePorIndex
            } else {
                return existePorIndex && existePorNome
            }
        });

        if (arquivoObj != undefined) return 'arquivo';

        let dirObj = this.diretorios.find(dirObj => {
            let existePorNome = dirObj.nome == nomeLink;
            let existePorIndex = dirObj.indexSistema == indexSistema;

            if (nomeLink != undefined && indexSistema == undefined) {
                return existePorNome
            } else if (nomeLink == undefined && indexSistema != undefined) {
                return existePorIndex
            } else {
                return existePorIndex && existePorNome
            }
        });

        if (dirObj != undefined) return 'diretorio';

        return ''
    }

    /**
     * 
     * @param {String} nomeLink 
     * @returns {Boolean}
     */
    existeLink(nomeLink, indexSistema) {
        let arquivoObj = this.arquivos.find(arqObj => {
            let existePorNome = arqObj.nomeArquivo == nomeLink;
            let existePorIndex = arqObj.indexSistema == indexSistema;

            if (nomeLink != undefined && indexSistema == undefined) {
                return existePorNome
            } else if (nomeLink == undefined && indexSistema != undefined) {
                return existePorIndex
            } else {
                return existePorIndex && existePorNome
            }
        });

        if (arquivoObj != undefined) {
            return true;
        }

        let diretorioObj = this.diretorios.find(dirObj => {
            let existePorNome = dirObj.nomeArquivo == nomeLink;
            let existePorIndex = dirObj.indexSistema == indexSistema;

            if (nomeLink != undefined && indexSistema == undefined) {
                return existePorNome
            } else if (nomeLink == undefined && indexSistema != undefined) {
                return existePorIndex
            } else {
                return existePorIndex && existePorNome
            }
        });

        if (diretorioObj != undefined) {
            return true;
        }

        return false
    }

    /**
     * Retornar os links existentes no cache desse diretorio
     * @param {Boolean} recursivo - Retornar todos os arquivos e pastas a partir deste diretorio. Por padrão é false 
     */
    getLinks(recursivo = false) {

        /**
         * @typedef LinkCache 
         * @property {Arquivo[]} arquivos - Lista de links que são arquivos
         * @property {Diretorio[]} diretorios - Lista de links que são diretorios
         */


        /**
         * Um objeto contendo a lista de arquivos e diretorios dentro desse diretorio
         * @type {LinkCache}
         */
        let linksCache = {
            arquivos: [],
            diretorios: []
        };

        for (const arquivo of this.arquivos) {
            linksCache.arquivos.push(arquivo)
        }

        for (const diretorio of this.diretorios) {
            linksCache.diretorios.push(diretorio)

            if (recursivo) {
                let linksDesseDir = diretorio.getLinks(true);

                linksCache.arquivos = linksCache.arquivos.concat(linksDesseDir.arquivos);
                linksCache.diretorios = linksCache.arquivos.concat(linksDesseDir.diretorios);
            }
        }

        return linksCache;
    }

    log(msg) {
        let conteudoMsg = ''

        if (typeof msg == "object") {
            conteudoMsg = JSON.stringify(msg, null, 4);
        } else if (typeof msg == "string") {
            conteudoMsg = msg;
        }


        console.log(`[${new Date().toLocaleTimeString()}]${this.caminhoCompletoDiretorio} -> ${conteudoMsg}`);
    }
}