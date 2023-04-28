import fs from "fs";
import path from "path";
import { Diretorio } from "./Diretorio.js";

/**
 * Representa um arquivo dentro de um diretorio
 */
export class Arquivo {
    /**
     * Nome do arquivo, incluindo sua extensão
     * @type {String}
     */
    nomeArquivo = ''

    /**
     * Caminho completo do arquivo no sistema
     * @type {String}
     */
    caminhoCompletoArquivo = ''

    /**
     * O objeto diretorio que esse arquivo pertence
     * @type {Diretorio}
     */
    refDiretorio;

    /**
     * ID unico desse arquivo no sistema
     */
    indexSistema = '';

    /**
     * Instancia um novo arquivo
     * @param {String} caminho_arquivo - Caminho completo do sistema até o arquivo 
     * @param {Diretorio} ref_diretorio - Instancia do diretorio que o arquivo pertence
     */
    constructor(caminho_arquivo, ref_diretorio) {

        this.nomeArquivo = path.basename(caminho_arquivo);
        this.caminhoCompletoArquivo = caminho_arquivo;
        this.refDiretorio = ref_diretorio;

        this.carregarPropriedades();
    }

    /**
     * Carrega algumas informações do arquivo 
     */
    carregarPropriedades() {
        let linkPropriedades = fs.statSync(this.caminhoCompletoArquivo);
        this.indexSistema = `${linkPropriedades.ino}${linkPropriedades.dev}`
    }

    /**
     * Retorna a extensão do arquivo
     */
    getExtensao() {
        return path.extname(this.nomeArquivo);
    }

    /**
     * Retorna o nome sem extensão
     */
    getNomeSemExtensao() {
        return this.nomeArquivo.indexOf(0, this.nomeArquivo.indexOf("."));
    }

    /**
     * Atualizar o diretorio pai desse arquivo para outro.
     ** Ex: O diretorio do arquivo é C:\teste\arquivos\texto.txt, passar como parametro C:\teste\xablau irá alterar para C:\testes\xablau\texto.txt
     * @param {String} novo_diretorio - Caminho completo do novo diretorio
     */
    atualizarDiretorioPai(novo_diretorio) {
        let novoCaminho = `${novo_diretorio}\\${this.nomeArquivo}`;

        this.log(`Alterando meu novo caminho para ${novoCaminho}`);
        this.caminhoCompletoArquivo = novoCaminho;

        // Recarrega as propriedades
        this.carregarPropriedades();
    }

    /**
     * Atualizar o nome do arquivo, incluindo sua extensão
     * @param {String} novo_nome 
     */
    atualizarNome(novo_nome) {

        let novoNome = novo_nome;
        let novoCaminhoCompleto = `${path.dirname(this.caminhoCompletoArquivo)}\\${novoNome}`;

        this.log(`Alterando meu nome para ${novoNome}`);
        this.nomeArquivo = novoNome;
        this.caminhoCompletoArquivo = novoCaminhoCompleto

        // Recarrega as propriedades
        this.carregarPropriedades();
    }

    /**
     * Logar alguma mensagem no console
     * @param {String} msg 
     */
    log(msg) {
        this.refDiretorio.log(`[${this.nomeArquivo}] -> ${msg}`)
    }
}