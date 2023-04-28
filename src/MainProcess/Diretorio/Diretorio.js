import { RegistradorEvento, RegistradorEventoTiposEventos } from "./RegistradorEvento.js";
import { lerDiretorio } from "@/UtilsMainRenderer/LerDiretorio.js";

/**
 * Representa um diretorio do sistema, contendo arquivos e diretorios.
 ** Por padrão, mudanças novas não são registradas aqui, deve-se instanciar um objeto Observador para que ele acompanhe as mudanaçs novas no diretorio,
 * caso contrario esse objeto irá apenas inicialmente ter a carga inicial do que foi lido quando instanciado
 */
export class Diretorio {
    /**
     * Caminho completo do diretorio no sistema
     * @type {String}
     */
    caminhoCompletoDiretorio = ''

    /**
     * Nome do diretorio
     * @type {String}
     */
    nome = ''

    /**
     * Array de arquivos contidos no diretorio
     * @type {[Arquivo]}
     */
    arquivos = [];

    /**
     * Array de outros diretorios contidos no diretório
     * @type {[Diretorio]}
     */
    diretorios = [];

    /**
     * Gerenciador de eventos responsavél por informar esse diretorio sobre novas mudanças
     * @type {RegistradorEvento}
     */
    gerenciadorEventos = new RegistradorEvento(this);

    /**
     * ID unico desse diretorio no sistema
     */
    indexSistema = ''

    /**
     * Instanciar um novo diretorio
     * @param {String} caminho_diretorio - Caminho completo até o diretorio 
     */
    constructor(caminho_diretorio) {
        this.caminhoCompletoDiretorio = caminho_diretorio;
        this.nome = path.basename(caminho_diretorio);
        this.lerLinks();
        this.carregarPropriedades();
        this.cadastrarListeners();
    }

    /**
     * Cadastrar as funções de atualizar o diretorio no gerenciador de eventos, para acompanhar novas mudanças de novos arquivos, excluões e quaisquer outras modificações...
     */
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

    /**
     * Ler todos os links(arquivo ou diretorio) dentro desse diretorio
     */
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

    /**
     * Carregar informações desse diretorio
     */
    carregarPropriedades() {
        let linkPropriedades = fs.statSync(this.caminhoCompletoDiretorio);
        this.indexSistema = `${linkPropriedades.ino}${linkPropriedades.dev}`;
    }

    /**
     * Adicionar um novo arquivo no diretorio
     * @param {String} nome_arquivo - Nome do arquivo para adicionar, somente o nome, sem o caminho do sistema completo.
     */
    addNovoArquivo(nome_arquivo) {
        let caminhoArquivo = `${this.caminhoCompletoDiretorio}\\${nome_arquivo}`;
        let novoArquivo = new Arquivo(caminhoArquivo, this);

        this.arquivos.push(novoArquivo);
    }

    /**
     * Adicionar um novo diretorio no diretorio
     * @param {String} nome_diretorio - Nome do diretório, sem o caminho do sistema completo.
     */
    addNovoDiretorio(nome_diretorio) {
        let caminhoDiretorio = `${this.caminhoCompletoDiretorio}\\${nome_diretorio}`;
        let novoDiretorio = new Diretorio(caminhoDiretorio);

        this.diretorios.push(novoDiretorio)
    }

    /**
     * Atualizar o diretorio pai desse diretorio
     * @param {String} novo_caminho - Novo caminho completo do diretorio pai
     */
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

        // Recarregar as propriedades
        this.carregarPropriedades();
    }

    /**
     * Atualizar o nome do diretorio
     * @param {String} novo_nome - Novo nome do diretorio
     */
    atualizarNome(novo_nome) {
        let novoNome = novo_nome;

        // O novo caminho é o mesmo, porém com o nome informado no parametro
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

        //  Recarregar as propriedades do diretório
        this.carregarPropriedades();
    }

    /**
     * Retorna o tipo do link(arquivo ou diretório) se ele existir. Caso contrario, retorna vazio
     ** Fornecer somente um argumento irá procurar somente por ele
     ** Se fornecer os dois argumentos, ambos os dois serão utilizados para buscar, sendo necessario que algum link seja exatamente igual ao nomeLink e indexSistema
     * @param {String} nomeLink - Nome do link que se deseja procurar(se for um arquivo, é necessário informar a extensão também)
     * @param {String} indexSistema - ID unico do arquivo no sistema inteiro
     * @returns {'arquivo' | 'diretorio' | ''}
     */
    getTipoLink(nomeLink, indexSistema) {
        // Em ambas as funções de .find, é utilizado os parametros nomeLink e indexSistema como forma de busca
        // Se somente um dos dois for fornecido, o find irá considerar somente ele, porém se os dois parametros forem fornecidos
        // Ele tentará encontrar um link que satisfaça os dois parametros

        let arquivoObj = this.arquivos.find(arqObj => {
            let existePorNome = arqObj.nomeArquivo == nomeLink;
            let existePorIndex = arqObj.indexSistema == indexSistema;

            // Se for considerar somente pelo nome
            if (nomeLink != undefined && indexSistema == undefined) {
                return existePorNome
            } else if (nomeLink == undefined && indexSistema != undefined) {
                // Se for considerar somente pelo indexSistema
                return existePorIndex
            } else {
                // Se for considerar por ambos os parametros
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
     * Verifica se o link existe no diretorio
     ** Fornecer somente um argumento irá procurar somente por ele
     ** Se fornecer os dois argumentos, ambos os dois serão utilizados para buscar, sendo necessario que algum link seja exatamente igual ao nomeLink e indexSistema
     * @param {String} nomeLink - Nome do link(se for arquivo é necessario informar a extensão também)
     * @param {String} indexSistema - ID unico desse link no sistema
     * @returns {Boolean}
     */
    existeLink(nomeLink, indexSistema) {
        // Em ambas as funções de .find, é utilizado os parametros nomeLink e indexSistema como forma de busca
        // Se somente um dos dois for fornecido, o find irá considerar somente ele, porém se os dois parametros forem fornecidos
        // Ele tentará encontrar um link que satisfaça os dois parametros

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
     * Retornar os links existentes nesse diretorio
     * @param {Boolean} recursivo - Retornar todos os arquivos e diretórios a partir deste diretorio. Por padrão é false 
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

            // Se recursivo estiver ativado, incluir junto todos os outros arquivos e diretórios filhos também
            if (recursivo) {
                let linksDesseDir = diretorio.getLinks(true);

                // Concatenar com os links existentes
                linksCache.arquivos = linksCache.arquivos.concat(linksDesseDir.arquivos);
                linksCache.diretorios = linksCache.arquivos.concat(linksDesseDir.diretorios);
            }
        }

        return linksCache;
    }

    /**
     * Logar algo no console
     * @param {String | Object} msg 
     */
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