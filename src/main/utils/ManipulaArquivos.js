import path from "path"
import fs from "fs"

/**
 * Representa um arquivo no sistema operacional
 */
class Arquivo {

    /**
     * Local do arquivo no sistema, ex: C:/Users/Desktop/log.txt
     * @type {String}
     */
    caminhoArquivo = '';

    /**
     * Inicia um objeto Arquivo, com o caminho de origem do arquivo 
     * @param {String} caminho 
     */
    constructor(caminho) {
        this.caminhoArquivo = caminho;
    }

    /**
     * Retorna o diretorio do arquivo
     * @return {String}
     */
    getDiretorio() {
        return path.dirname(this.caminhoArquivo);
    }

    /**
     * Retorna o nome do arquivo
     * @returns {String}
     */
    getNomeArquivo() {
        return path.basename(this.caminhoArquivo);
    }

    /**
     * Retorna a extensão do arquivo
     * @returns {String}
     */
    getExtensao() {
        return path.extname(this.caminhoArquivo);
    }

    /**
     * Retorna true/false se o arquivo existe
     * @returns {Boolean}
     */
    existe() {
        return fs.existsSync(this.caminhoArquivo);
    }

    /**
     * Criar o arquivo
     * @param {Boolean} substituirExistente Substituir o arquivo existente por um novo vazio? Por padrão é false
     */
    criarArquivo(substituirExistente = false) {

        if (this.existe() && !substituirExistente) return true;

        // Verifica se os diretorios até o arquivo existe
        criarDiretoriosInexistentes(this.caminhoArquivo)

        try {
            fs.writeFileSync(this.caminhoArquivo, "");
        } catch (ex) {
            console.log(ex);
            console.log(`Ocorreu um erro ao tentar criar o arquivo: ${this.caminhoArquivo}`);
            return false;
        }

        return true;
    }

    /**
     * Excluir o arquivo
     * @return {Boolean} True/false se foi possível excluir
     */
    excluirArquivo() {
        try {
            fs.unlinkSync(this.caminhoArquivo);
            return true;
        } catch (ex) {
            console.log(ex);
            console.log(`Ocorreu um erro ao tentar excluir o arquivo TXT`);
            return false;
        }
    }
}

/**
 * Representa uma classe para manipulação de arquivos que sejam do tipo JSON
 */
export class ArquivoJSON extends Arquivo {

    /**
     * Instancia um novo manipulador de arquivo JSON
     * @param {String} caminhoArquivo 
     */
    constructor(caminhoArquivo) {
        console.log("AAA");
        super(caminhoArquivo);
    }

    /**
     * Retorna o conteudo do arquivo como um objeto JSON
     * @returns {({} | undefined)} Retorna um objeto se não ocorrer erros na conversão do texto para JSON, caso contrario, retorna undefined
     */
    getJSON() {
        try {
            return JSON.parse(fs.readFileSync(this.caminhoArquivo))
        } catch (ex) {
            console.log(`Ocorreu um erro ao converter o arquivo ${this.caminhoArquivo} em JSON`);
            return;
        }
    }

    /**
     * Altera o conteudo do arquivo atual
     * Qualquer dado já existente no arquivo será sobrescrito pela novas informações
     * @param {any} objeto Novo objeto para ser inserido no arquivo
     * @param {('json' | 'texto')} tipo Tipo da informação a ser salva
     * @returns {Boolean} True ou false se o arquivo tiver sido alterado com sucesso 
     */
    setConteudo(objeto) {
        if (typeof objeto != "object") {
            console.log(`Conteudo para salvamento não é um objeto valido`);
            return;
        }

        let conteudoString = '';
        try {
            conteudoString = JSON.stringify(objeto, null, 4);
        } catch (ex) {
            console.log(ex);
            console.log(`Ocorreu um erro ao converter o objeto JSON em string, cancelando salvamento...`);
            return false;
        }

        if (!this.existe()) {
            console.log(`Arquivo ${this.getDiretorio()}/${this.getNomeArquivo()} não existe ainda...`);
            this.criarArquivo();
        }

        // Após obter o que é pra salvar, tenta salvar o conteudo no arquivo
        try {
            fs.writeFileSync(this.caminhoArquivo, conteudoString, { encoding: "utf-8" });
        } catch (ex) {
            console.log(ex);
            console.log(`Ocorreu um erro ao tentar salvar o arquivo, cancelando salvamento...`);
            return false;
        }

        return true;
    }
}

/**
 * Representa uma classe para manipulação de arquivos que sejam do tipo TXT
 */
export class ArquivoTXT extends Arquivo {
    constructor(caminhoArquivo) {
        super(caminhoArquivo)
    }

    /**
     * Adicionar uma string nova ou um array de strings ao arquivo
     * @param {(String | Array)} conteudoEscrever 
     * @returns {Boolean} True/false se deu certo a inserção do conteudo no arquivo
     */
    adicionarLinha(conteudoEscrever) {

        // Array contendo a(s) linha(s) que serão inseridas no arquivo
        let linhasParaEscrever = [];

        if (Array.isArray(conteudoEscrever)) {

            // Se for um array, passo por cada conteudo dentro do array e insiro o conteudo no array de linhas
            conteudoEscrever.forEach(conteudoArray => {
                if (typeof conteudoArray == "object") {
                    // Se for um objeto, converto para string
                    try {
                        linhasParaEscrever.push(JSON.stringify(conteudoArray, null, 4));
                    } catch (ex) {
                        console.log(ex);
                        console.log(`Ocorreu um erro ao converter objeto para string, cancelando salvamento...`);
                        return false;
                    }
                } else {
                    // Se for qualquer outro tipo, da um tostring mesmo
                    linhasParaEscrever.push(conteudoArray.toString())
                }
            });

        } else if (typeof conteudoEscrever == "string") {
            // Se for uma string, só adiciono no array
            linhasParaEscrever.push(conteudoEscrever);
        } else if (typeof conteudoEscrever == "object") {
            // Se for um objeto, tento converter ele para string e adicionar ao array
            try {
                linhasParaEscrever.push(JSON.stringify(conteudoEscrever, null, 4));
            } catch (ex) {
                console.log(`Ocorreu um converter objeto para string, cancelando salvamento...`);
                return false;
            }
        }
        // Entro em cada linha que foi adicionada para ser inserida no arquivo txt
        for (const linha of linhasParaEscrever) {
            // Dou um try para garantir que não ocorra erros
            try {
                fs.appendFileSync(this.caminhoArquivo, linha, { encoding: "utf-8" });
            } catch (ex) {
                console.log(ex);
                console.log(`Ocorreu um erro ao salvar as informações no arquivo TXT, cancelando salvamento...`);
                return false;
            }
        }
        return true;
    }

    /**
     * Exclui todos os caracteres que tem no arquivo e deixa como um arquivo txt vazio
     * @return {Boolean} True/false se deu certo ao limpar
     */
    limparArquivo() {
        try {
            fs.writeFileSync(this.caminhoArquivo, '');
            return true;
        } catch (ex) {
            console.log(ex);
            console.log(`Ocorreu um erro ao limpar arquivo TXT`);
            return false;
        }
    }
}

/**
 * Cria todos os diretorios inexistentes até um certo ponto.
 ** Exemplo, passando o parametro C:/Users/Desktop/teste1/teste2/testes.json, digamos que as pastas teste1 e teste2 não existam, elas serão criadas.
 ** Nomes de arquivos são ignorados, somente pastas são criadas
 * @param {String} diretorioAlvo 
 * @return {Boolean} True/false se não foi possível gerar os diretorios
 */
function criarDiretoriosInexistentes(diretorioAlvo) {
    // Substituir outras barras diferentes 
    diretorioAlvo = diretorioAlvo.replaceAll("\\", "/");

    // Separa em um array o caminho ate a pasta final
    let diretoriosEncontrados = diretorioAlvo.split("/");

    // O diretorio inicial já com o primeiro preenchido
    let diretorioAtual = diretoriosEncontrados.shift()
    for (const diretorio of diretoriosEncontrados) {

        // Junta o proximo diretorio com o anterior
        diretorioAtual += `/${diretorio}`

        // Se o nome da pasta conter pontos mas não for o ultimo caminho, eu gero a pasta, verificar pq pode ter sido indicado um caminho de arquivo no final
        if (diretorio.indexOf(".") != -1 && (diretoriosEncontrados[diretoriosEncontrados.length - 1] == diretorio)) {
            break;
        }

        // Se não existir o diretorio, tentar criar
        if (!fs.existsSync(diretorioAtual)) {
            try {
                // fs.mkdirSync(diretorioAtual);
                console.log(`Criando diretorio ${diretorioAtual}`);
            } catch (ex) {
                console.log(ex);
                console.log(`Não foi possível criar o diretorio: ${diretorioAtual}`);
                return false;
            }
        }
    }
    return true;
}