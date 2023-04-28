
/**
 * Classe que cuida de eventos disparaveis e escutaveis
 */
export class EmissorEvento {
    /**
     * Função callback cadastrada
     * @typedef {Object} EventosFuncao
     * @property {Number} id - ID atribuido a esse evento. Serve para poder remove-lo em outro momento
     * @property {Function} funcao - Função que será executadas
     * @property {Object} opcoes - Opções da função
     * @property {Boolean} opcoes.unico - Se true, a função será executada uma unica vez e automaticamente será excluida logo após
     */

    /**
     * Lista de eventos para disparar
     * @typedef {Object} Evento
     * @property {String} nomeEvento - Nome do evento(como data, open, close..)
     * @property {[EventosFuncao]} funcoes - Array contendo as funções para executar
    */

    /**
     * Eventos que serão chamados quando necessarios. É possível adicionar um evento varias vezes, cada um será chamado
     */
    eventosCadastrados = {
        /**
         * Eventos adicionados para serem chamados
         * @type {[Evento]}
         */
        eventos: [],

        /**
         * ID unico que é dado para cada evento adicionado
         */
        indexId: 0
    }

    /**
     * Verifica se existe algum evento cadastrado com o nome especificado
     * @return {Boolean} True/false se existe
     */
    existeEvento(nomeEvento) {
        let existe = this.eventosCadastrados.eventos.find(eventoObj => eventoObj.nomeEvento == nomeEvento);

        return existe != undefined;
    }

    /**
     * Cadastra um novo evento para ser executado
     * @param {String} nomeEvento - Nome do evento para escutar
     * @param {Function} funcaoCallback - Função callback 
     * @param {Object} opcoes - Opcoes do evento
     * @param {Boolean} opcoes.unico - Define se o evento deve ser disparado somente uma unica vez, e depois cancelado
     * @returns {Number} - Retorna um ID vinculado a esse evento cadastrado, para cancela-lo futuramente
     */
    addEvento(nomeEvento, funcaoCallback, opcoes = { unico: false }) {
        let eventosVinculados = this.eventosCadastrados.eventos.find(eventoObj => eventoObj.nomeEvento == nomeEvento);

        // ID que será atribuido ao evento
        let eventoIdNovo = this.eventosCadastrados.indexId;

        /**
         * @type {EventosFuncao}
         */
        let eventoNovo = {
            id: eventoIdNovo,
            funcao: funcaoCallback,
            opcoes: {
                unico: opcoes.unico
            }
        }

        // Se o evento ainda não existe, cria ele e adiciona a função
        if (eventosVinculados == undefined) {
            this.eventosCadastrados.eventos.push({
                nomeEvento: nomeEvento,
                funcoes: [eventoNovo]
            })

            this.eventosCadastrados.indexId++;
        } else {
            eventosVinculados.funcoes.push(eventoNovo)

            this.eventosCadastrados.indexId++;
        }

        return eventoIdNovo;
    }

    /**
     * Remove algum evento handler cadastrado pela função onEvento.
     * @param {Number} idEvento - ID unico do evento
     * @returns {Boolean} - Se removeu com sucesso ou não o evento
     */
    cancelarEvento(idEvento) {
        for (const tiposEventos of this.eventosCadastrados.eventos) {
            let existeId = tiposEventos.funcoes.find(funcaoObj => funcaoObj.id == idEvento);

            if (existeId != undefined) {
                tiposEventos.funcoes = tiposEventos.funcoes.filter(funcaoObj => funcaoObj.id != idEvento);
                return true;
            }
        }

        return false;
    }

    /**
     * Disparar o evento desejado
     * @param nomeEvento - Nome do evento para disparar
     * @param args - Argumentos que podem ser usados nas funções
     */
    dispararEvento(nomeEvento, ...args) {
        for (const tiposEventos of this.eventosCadastrados.eventos.filter(eventoObj => eventoObj.nomeEvento == nomeEvento)) {
            for (const funcaoExecutar of tiposEventos.funcoes) {
                funcaoExecutar.funcao(...args);

                if (funcaoExecutar.opcoes.unico) {
                    this.cancelarEvento(funcaoExecutar.id);
                }
            }
        }
    }
}