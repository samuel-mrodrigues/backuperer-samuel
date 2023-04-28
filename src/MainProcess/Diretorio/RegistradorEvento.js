import fs from "fs";

import { Diretorio } from "./Diretorio.js";
import { EmissorEvento } from "@/UtilsMainRenderer/EventoEmissor.js";

import { lerDiretorio } from "@/UtilsMainRenderer/LerDiretorio.js";
import { getIndexSistemaLink } from "../Utils/Utils.js";

/**
 * O registrador de eventos recebe e manipula os eventos(novo, excluir, renomear) e repassam ao diretorio exatamente a ação que foi realizada.
 */
export class RegistradorEvento {

    /**
     * A instância do diretório em que esse registrador está vinculado. Todos os eventos serão repassados a esse diretorio
     * @type {Diretorio}
     */
    instanciaDiretorio;

    /**
     * Listener do tipo EventEmitter, para emitir os eventos e escutar por eles
     */
    gerenciadorListener = new EmissorEvento();

    /**
     * Instancia um registrador de evento para receber os eventos de um diretorio
     * @param {Diretorio} instancia_diretorio 
     */
    constructor(instancia_diretorio) {
        this.instanciaDiretorio = instancia_diretorio;
    }

    /**
     * Disparar um evento para processar no diretorio
     * @param {String} arquivoAlvo - O nome do link envolvido. Será o caminho do diretorio inicial que foi setado para observar até o caminho do link
     * @param {'rename' | 'change' | 'error' | 'close'} tipoMudanca - O tipo de mudança que ocorreu 
     */
    dispararEvento(arquivoAlvo, tipoMudanca) {
        this.log(`Processando evento ${tipoMudanca} em -> ${arquivoAlvo}`);

        // Dividir o caminho do evento em diretorios para saber qual o proximo diretorio para repassar o evento
        // É necessário isso, pois mudanças em algum subdiretório do tipo: meudiretorio/testes/arquivo.txt, o evento é recebido em meudiretório,
        // Mas o diretorio que precisa processar essa mudança será o diretorio pai do link que está sendo modificado, que no caso seria o testes
        let pastasCaminho = arquivoAlvo.split("\\")

        if (pastasCaminho.length != 1) {
            // Se tiver diretórios para repassar, encontrar o próximo e repassar
            let proximoDiretorio = this.instanciaDiretorio.diretorios.find(dirObj => dirObj.nome == pastasCaminho[0]);

            if (proximoDiretorio == undefined) {
                this.log(`Proximo diretorio não encontrado para repassar evento de mudança!`);
                return;
            }

            // Remover esse diretório da string e repassar para o próximo
            pastasCaminho.shift();
            proximoDiretorio.gerenciadorEventos.dispararEvento(pastasCaminho.join('\\'), tipoMudanca);
        } else {
            // Não contendo mais diretorios, o link deve ser processar por esse diretorio atual

            // Verificar o tipo do evento e chamar a função apropriadade que irá tratar dela.
            switch (tipoMudanca) {

                // O tipo rename é usado em situações de:
                // Um link foi criado
                // Um link foi renomeado
                // Um link foi excluido
                case "rename": {
                    this.tratarRename(arquivoAlvo)
                    break;
                }
            }
        }
    }

    /**
     * Tratar o evento de rename no link atual nesse diretorio
     * @param {String} nomeLink - Nome do link(arquivo/diretorio) alterado
     ** Somente o nome do link, sem incluir diretorios!
     */
    tratarRename(nomeLink) {
        this.log(`Processando rename em ${nomeLink}`)

        // Caminho completo do link, do diretorio do sistema até chegar ao link em questão.
        let caminhoCompletoLink = `${this.instanciaDiretorio.caminhoCompletoDiretorio}\\${nomeLink}`
        this.log(`Caminho do arquivo completo: ${caminhoCompletoLink}`)

        let existeLinkFisicamente = fs.existsSync(caminhoCompletoLink);
        this.log(`Existe fisicamente? ${existeLinkFisicamente}`)

        // Se o link existir, ele foi criado ou renomeado
        if (existeLinkFisicamente) {

            // Retorna o id unico do link no sistema
            let indexSistemaDoLink = getIndexSistemaLink(caminhoCompletoLink)

            // Verificar na instancia do diretorio se existe algum link com o id unico desse link
            let existeLinkNoDiretorio = this.instanciaDiretorio.existeLink(undefined, indexSistemaDoLink)

            // Se o link não existir, é pq o link não existe no cache do diretorio e foi criado recentemente
            if (!existeLinkNoDiretorio) {

                // Disparar o evento correspondente correto para o diretorio saber que tem um novo tipo de link sendo criado
                if (linkPropriedades.isDirectory()) {
                    this.gerenciadorListener.dispararEvento(RegistradorEventoTiposEventos.DIRETORIO_CRIADO, nomeLink);
                } else {
                    this.gerenciadorListener.dispararEvento(RegistradorEventoTiposEventos.ARQUIVO_CRIADO, nomeLink);
                }
            } else {
                this.log(`Link já existe no diretorio, provavélmente é o resto do evento de renomear!`);
            }

        } else {
            // Se o link não existir fisicamente, ele foi renomeado ou excluido

            // O evento de renomear emite duas vezes
            // É emitido um rename com o nome antigo do arquivo
            // É emitido um outro evento rename com o nome novo, que é tratado no if acima

            // Pegar se o link é um diretorio ou um arquivo
            let tipoDoLinkNoCache = this.instanciaDiretorio.getTipoLink(nomeLink);

            // Leio o diretorio para achar arquivos e diretorios existentes 
            let linksDiretorio = lerDiretorio(this.instanciaDiretorio.caminhoCompletoDiretorio);

            // Se for um arquivo
            if (tipoDoLinkNoCache == "arquivo") {

                // Tenta encontrar o arquivo no cache do diretorio
                let arquivoNoCache = this.instanciaDiretorio.arquivos.find(arqObj => arqObj.nomeArquivo == nomeLink);
                if (arquivoNoCache != undefined) {

                    // Se o arquivo existe ainda ou não
                    let arquivoExisteAinda = false;

                    // Se o arquivo foi renomeado, salvar o novo nome dele
                    let novoNomeSeRenomeado = '';

                    // Passar pelos arquivos encontrados na leitura, e verificar se o id unico dele combina com o que existe no cache, significando que foi renomeado
                    // Se não achar, é pq ele foi deletado
                    for (const arquivoEncontrado of linksDiretorio.arquivos) {
                        let indexSistemaDoArquivo = getIndexSistemaLink(arquivoEncontrado.caminhoCompleto);

                        // Se combinar o ID desse arquivo com o que tem no cache, é o mesmo arquivo só que renomeado
                        if (arquivoNoCache.indexSistema == indexSistemaDoArquivo) {
                            novoNomeSeRenomeado = arquivoEncontrado.nomeExtensao;
                            arquivoExisteAinda = true;
                            break;
                        }
                    }

                    // Se o arquivo existir, é pq foi renomeado realmente
                    if (arquivoExisteAinda) {
                        this.log(`Arquivo foi renomeado para ${novoNomeSeRenomeado}`);

                        // Emitir o evento de renomeação
                        this.gerenciadorListener.dispararEvento(RegistradorEventoTiposEventos.ARQUIVO_RENOMEADO, nomeLink, novoNomeSeRenomeado);
                    } else {

                        // O arquivo foi excluido do diretorio em que ele se encontra
                        this.log(`O arquivo foi excluido`);

                        // Emitir o evento de exclusão
                        this.gerenciadorListener.dispararEvento(RegistradorEventoTiposEventos.ARQUIVO_DELETADO, nomeLink);
                    }
                } else {
                    this.log(`O arquivo não foi encontrado no meu cache!`)
                }

            } else if (tipoDoLinkNoCache == "diretorio") {
                // Se o link em questão for um diretório


                // Encontra o diretorio que foi modificado no cache
                let diretorioNoCache = this.instanciaDiretorio.diretorios.find(dirObj => dirObj.nome == nomeLink);
                if (diretorioNoCache != undefined) {

                    // Se o diretorio ainda existe
                    let diretorioExisteAinda = false;
                    // Novo nome do diretorio se foi renomeado
                    let novoNomeSeRenomeado = '';

                    // Passar por cada diretório existente, e verificar se o ID unico dele combina com o anterior do cache
                    for (const diretorioEncontrado of linksDiretorio.diretorios) {
                        let indexSistemaDoDiretorio = getIndexSistemaLink(diretorioEncontrado.caminhoCompleto);

                        // Se o ID index do sistema combinar com o ID que tenho no cache, é pq o diretorio é o mesmo, só foi renomeado
                        if (diretorioNoCache.indexSistema == indexSistemaDoDiretorio) {

                            // Salva as informações que foi renomeado e o novo nome
                            diretorioExisteAinda = true;
                            novoNomeSeRenomeado = diretorioEncontrado.nome;
                            break;
                        }
                    }

                    if (diretorioExisteAinda) {
                        this.log(`O diretorio foi renomeado para ${novoNomeSeRenomeado}`);

                        // Emitir o evento que o diretorio foi renomeado, passando como 1 argumento o antigo nome, e o novo nome
                        this.gerenciadorListener.dispararEvento(RegistradorEventoTiposEventos.DIRETORIO_RENOMEADO, nomeLink, novoNomeSeRenomeado);
                    } else {
                        this.log(`O diretorio foi excluido!`);

                        // Emitir o evento que o diretório foi excluido
                        this.gerenciadorListener.dispararEvento(RegistradorEventoTiposEventos.DIRETORIO_DELETADO, nomeLink);
                    }
                } else {
                    this.log(`Diretorio não encontrado no cache`);
                }
            } else {
                // Se não tiver sido encontrado o nome do arquivo(tipo do arquivo vem vazio '')
                this.log(`Arquivo não foi encontrado no meu cache!`);
            }
        }
    }

    /**
     * Uma função para executar quando um novo arquivo for criado
     * @callback ArquivoCriado
     * @param {String} nome Nome do arquivo com a extensão.
     */

    /**
     * Executar uma função quando um arquivo for criado
     ** Essa função pode ser chamada várias vezes, a cada vez será adicionada um listener novo com um ID unico para cancelamento caso desejado
     * @param {ArquivoCriado} funcaoCallback - Função para executar
     * @returns {Number} - Retorna um numero ID do listener criado, para cancelamento futuro
     */
    onArquivoCriado(funcaoCallback) {
        let novoEvento = this.gerenciadorListener.addEvento(RegistradorEventoTiposEventos.ARQUIVO_CRIADO, funcaoCallback);

        return novoEvento;
    }

    /**
     * Uma função para executar quando um arquivo for renomeado
     * @callback ArquivoRenomeado
     * @param {String} nomeAntigo - O nome antigo do arquivo(com extensão)
     * @param {String} nomeNovo - O novo nome do arquivo após renomear 
     */

    /**
     * Uma função para executar quando um arquivo for renomeado
     * @param {ArquivoRenomeado} funcaoCallback - Função para executar
    * @returns {Number} - Retorna um numero ID do listener criado, para cancelamento futuro
     */
    onArquivoRenomeado(funcaoCallback) {
        let novoEvento = this.gerenciadorListener.addEvento(RegistradorEventoTiposEventos.ARQUIVO_RENOMEADO, funcaoCallback);

        return novoEvento;
    }

    /**
     * Uma função para executar quando um arquivo for deletado
     * @callback ArquivoDeletado
     * @param {String} nome - O nome do arquivo deletado
     */

    /**
     * Uma função para executar quando um arquivo é deletado
     * @param {ArquivoDeletado} funcaoCallback
     * @returns {Number} - Retorna um numero ID do listener criado, para cancelamento futuro
     */
    onArquivoDeletado(funcaoCallback) {
        let novoEvento = this.gerenciadorListener.addEvento(RegistradorEventoTiposEventos.ARQUIVO_DELETADO, funcaoCallback);

        return novoEvento;
    }

    /**
     * Uma função para executar quando um novo arquivo for criado
     * @callback DiretorioCriado
     * @param {String} nome - O nome do diretorio que foi criado
     */

    /**
     * Uma função para executar quando um novo diretório é criado
     * @param {DiretorioCriado} funcaoCallback - Função para executar
     * @returns {Number} - Retorna um numero ID do listener criado, para cancelamento futuro
     */
    onDiretorioCriado(funcaoCallback) {
        let novoEvento = this.gerenciadorListener.addEvento(RegistradorEventoTiposEventos.DIRETORIO_CRIADO, funcaoCallback);

        return novoEvento;
    }

    /**
     * Uma função para executar quando um diretorio é renomeado
     * @callback DiretorioRenomeado
     * @param {String} nomeAntigo - O nome antigo do diretorio 
     * @param {String} nomeNovo - O novo nome do diretorio
     */

    /**
     * Uma função para executar quando um diretório for renomeado
     * @param {DiretorioRenomeado} funcaoCallback - Função para executar
     * @returns {Number} - Retorna um numero ID do listener criado, para cancelamento futuro
     */
    onDiretorioRenomeado(funcaoCallback) {
        let novoEvento = this.gerenciadorListener.addEvento(RegistradorEventoTiposEventos.DIRETORIO_RENOMEADO, funcaoCallback);

        return novoEvento;
    }

    /**
     * Uma função para executar quando um diretorio é deletado
     * @callback DiretorioDeletado
     * @param {String} nome - O nome do diretorio deletado
     */

    /**
     * Uma função para executar quando um diretório for deletado
     * @param {DiretorioDeletado} funcaoCallback - Função para executar
     * @returns {Number} - Retorna um numero ID do listener criado, para cancelamento futuro
     */
    onDiretorioDeletado(funcaoCallback) {
        let novoEvento = this.gerenciadorListener.addEvento(RegistradorEventoTiposEventos.DIRETORIO_DELETADO, funcaoCallback);

        return novoEvento;
    }

    /**
     * Escreve uma mensagem de log chamando a função de log do diretório vinculado a ele
     * @param {String} msg 
     */
    log(msg) {
        this.instanciaDiretorio.log(msg);
    }
}

/**
 * Lista de eventos que o registrador usa
 */
export const RegistradorEventoTiposEventos = {
    /**
     * Um arquivo é criado
     */
    ARQUIVO_CRIADO: 'ARQUIVO_CRIADO',
    /**
     * Um arquivo é deletado
     */
    ARQUIVO_DELETADO: 'ARQUIVO_DELETADO',
    /**
     * Um arquivo é renomeado
     */
    ARQUIVO_RENOMEADO: 'ARQUIVO_RENOMEADO',
    /**
     * Um diretorio foi criado
     */
    DIRETORIO_CRIADO: 'DIRETORIO_CRIADO',
    /**
     * Um diretorio foi renomeado
     */
    DIRETORIO_RENOMEADO: 'DIRETORIO_RENOMEADO',
    /**
     * Um diretorio foi deletado
     */
    DIRETORIO_DELETADO: 'DIRETORIO_DELETADO'
}