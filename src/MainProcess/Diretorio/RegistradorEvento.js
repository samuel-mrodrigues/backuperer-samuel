import fs from "fs";

import { EmissorEvento } from "@/UtilsMainRenderer/EventoEmissor.js";
import { lerDiretorio } from "@/UtilsMainRenderer/LerDiretorio.js";
import { Diretorio } from "./Diretorio.js";


export class RegistradorEvento {

    /**
     * @type {Diretorio}
     */
    instanciaDiretorio;

    gerenciadorListener = new EmissorEvento();

    /**
     * 
     * @param {Diretorio} instancia_diretorio 
     */
    constructor(instancia_diretorio) {
        this.instanciaDiretorio = instancia_diretorio;
    }

    /**
     * 
     * @param {String} arquivoAlvo 
     * @param {'rename' | 'change' | 'error' | 'close'} tipoMudanca 
     */
    dispararEvento(arquivoAlvo, tipoMudanca) {
        this.log(`Processando evento ${tipoMudanca} em -> ${arquivoAlvo}`);

        let pastasCaminho = arquivoAlvo.split("\\")

        if (pastasCaminho.length != 1) {
            let proximoDiretorio = this.instanciaDiretorio.diretorios.find(dirObj => dirObj.nome == pastasCaminho[0]);

            if (proximoDiretorio == undefined) {
                this.log(`Proximo diretorio não encontrado para repassar evento de mudança!`);
                return;
            }

            pastasCaminho.shift();
            proximoDiretorio.gerenciadorEventos.dispararEvento(pastasCaminho.join('\\'), tipoMudanca);
        } else {
            switch (tipoMudanca) {
                case "rename": {
                    this.tratarRename(arquivoAlvo)
                    break;
                }
            }
        }
    }

    tratarRename(nomeLink) {
        this.log(`Processando rename em ${nomeLink}`)
        let caminhoCompletoLink = `${this.instanciaDiretorio.caminhoCompletoDiretorio}\\${nomeLink}`
        this.log(`Caminho do arquivo completo: ${caminhoCompletoLink}`)

        let existeLinkFisicamente = fs.existsSync(caminhoCompletoLink);
        this.log(`Existe fisicamente? ${existeLinkFisicamente}`)

        // Se o link existir, o arquivo foi criado ou renomeado
        if (existeLinkFisicamente) {
            let linkPropriedades = fs.statSync(caminhoCompletoLink);
            let indexSistemaDoLink = `${linkPropriedades.ino}${linkPropriedades.dev}`;

            // Verificar na instancia do diretorio se existe algum link com o id unico desse link
            let existeLinkNoDiretorio = this.instanciaDiretorio.existeLink(undefined, indexSistemaDoLink)

            // Se o link não existir, é pq o arquivo não existe no cache do diretorio e foi criado recentemente
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
            // Pegar se o link é um diretorio ou um arquivo
            let tipoDoLinkNoCache = this.instanciaDiretorio.getTipoLink(nomeLink);

            // Arquivos e diretorios existentes 
            let linksDiretorio = lerDiretorio(this.instanciaDiretorio.caminhoCompletoDiretorio);

            // Se for um arquivo
            if (tipoDoLinkNoCache == "arquivo") {

                let arquivoNoCache = this.instanciaDiretorio.arquivos.find(arqObj => arqObj.nomeArquivo == nomeLink);
                if (arquivoNoCache != undefined) {

                    let arquivoExisteAinda = false;
                    let novoNomeSeRenomeado = '';

                    for (const arquivoEncontrado of linksDiretorio.arquivos) {
                        let arquivoPropriedades = fs.statSync(arquivoEncontrado.caminhoCompleto);
                        let indexSistemaDoArquivo = `${arquivoPropriedades.ino}${arquivoPropriedades.dev}`;

                        if (arquivoNoCache.indexSistema == indexSistemaDoArquivo) {
                            novoNomeSeRenomeado = arquivoEncontrado.nomeExtensao;
                            arquivoExisteAinda = true;
                            break;
                        }
                    }

                    // Se o arquivo existir ainda, é pq foi renomeado
                    if (arquivoExisteAinda) {
                        this.log(`Arquivo foi renomeado para ${novoNomeSeRenomeado}`);

                        this.gerenciadorListener.dispararEvento(RegistradorEventoTiposEventos.ARQUIVO_RENOMEADO, nomeLink, novoNomeSeRenomeado);
                    } else {
                        // O arquivo foi excluido mesmo do diretorio em que ele se encontra
                        this.log(`O arquivo foi excluido`);
                        this.gerenciadorListener.dispararEvento(RegistradorEventoTiposEventos.ARQUIVO_DELETADO, nomeLink);
                    }
                } else {
                    this.log(`O arquivo não foi encontrado no meu cache!`)
                }

            } else if (tipoDoLinkNoCache == "diretorio") {
                // Se for um diretorio

                let diretorioNoCache = this.instanciaDiretorio.diretorios.find(dirObj => dirObj.nome == nomeLink);
                if (diretorioNoCache != undefined) {

                    let diretorioExisteAinda = false;
                    let novoNomeSeRenomeado = '';
                    for (const diretorioEncontrado of linksDiretorio.diretorios) {
                        let arquivoPropriedades = fs.statSync(diretorioEncontrado.caminhoCompleto);
                        let indexSistemaDoDiretorio = `${arquivoPropriedades.ino}${arquivoPropriedades.dev}`;

                        if (diretorioNoCache.indexSistema == indexSistemaDoDiretorio) {
                            diretorioExisteAinda = true;
                            novoNomeSeRenomeado = diretorioEncontrado.nome;
                            break;
                        }
                    }

                    if (diretorioExisteAinda) {
                        this.log(`O diretorio foi renomeado para ${novoNomeSeRenomeado}`);

                        this.gerenciadorListener.dispararEvento(RegistradorEventoTiposEventos.DIRETORIO_RENOMEADO, nomeLink, novoNomeSeRenomeado);
                    } else {
                        this.log(`O diretorio foi excluido!`);

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
     * @param {ArquivoCriado} funcaoCallback
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
     * @param {ArquivoRenomeado} funcaoCallback
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
     * @param {ArquivoDeletado} funcaoCallback
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
     * @param {DiretorioCriado} funcaoCallback
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
     * @param {DiretorioRenomeado} funcaoCallback
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
     * @param {DiretorioDeletado} funcaoCallback
     */
    onDiretorioDeletado(funcaoCallback) {
        let novoEvento = this.gerenciadorListener.addEvento(RegistradorEventoTiposEventos.DIRETORIO_DELETADO, funcaoCallback);

        return novoEvento;
    }

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