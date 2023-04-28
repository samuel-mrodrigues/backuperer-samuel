import fs from "fs";
import { Diretorio } from "./Diretorio.js";

/**
 * Observa um diretório por mudanças novas nele, e dispara os eventos relacionados.
 */
export class DiretorioObservador {

    /**
     * Objeto do Node que observa por mudanças no diretório e nos subdiretórios
     * @type {fs.FSWatcher}
     */
    nodeObserver;

    /**
     * O diretorio alvo em que esse observador está vinculado
     * @type {Diretorio}
     */
    diretorioAlvo;

    /**
     * Instancia um novo observador 
     * @param {String} diretorio_observar 
     */
    constructor(diretorio_observar) {
        if (!fs.existsSync(diretorio_observar)) {
            throw new Error("Diretorio informado não existe")
        }

        // Instancia o diretorio e atribui-lo
        let dirObservar = new Diretorio(diretorio_observar);
        this.diretorioAlvo = dirObservar;

        this.log(`Iniciando novo observador em: ${diretorio_observar}`);
        this.observar();
    }

    /**
     * Iniciar a observação das modificações no diretorio
     */
    observar() {
        let caminhoInicial = this.diretorioAlvo.caminhoCompletoDiretorio
        this.log(`Iniciando observador em ${caminhoInicial}`);

        this.nodeObserver = fs.watch(caminhoInicial, { recursive: true, encoding: "utf-8" });

        // Eventos de mudança no arquivo
        this.nodeObserver.on("change", (tipo_evento, file) => {
            this.log(`CHANGE EVENT! TIPO: ${tipo_evento}, ARQUIVO: ${caminhoInicial}\\${file}`);

            // Disparar para o registrador de evento desse diretorio, para processar as mudanças novas...
            this.diretorioAlvo.gerenciadorEventos.dispararEvento(file, tipo_evento)
        })

        this.nodeObserver.on("close", (a) => {
            this.log(`CLOSE EVENT!`);
        })

        this.nodeObserver.on("error", (erro) => {
            this.log(erro);
            this.log(`ERROR EVENT`);
        })
    }

    /**
     * Logar alguma informação no console.
     * @param {String} msg - Mensagem para mostrar
     */
    log(msg) {
        let conteudoMsg = ''

        if (typeof msg == "object") {
            conteudoMsg = JSON.stringify(msg, null, 4);
        } else if (typeof msg == "string") {
            conteudoMsg = msg;
        }

        console.log(`[${new Date().toLocaleTimeString()}][OBSERVADOR] ${this.diretorioAlvo.caminhoCompletoDiretorio} -> ${conteudoMsg}`);
    }
}