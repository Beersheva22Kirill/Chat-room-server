import {MongoClient} from 'mongodb'


export default class MongoConnection {

    #dataBase;
    #client;

    constructor(connection_string,dbName){
        this.#client = new MongoClient(connection_string);
        this.#client.connect();
        this.#dataBase = this.#client.db(dbName);

    }

    getCollection(collectionName){
        return this.#dataBase.collection(collectionName);
    }
}