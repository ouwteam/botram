
module.exports = class ConnectionManager {
    constructor(Clients = [], ClientReady = []) {
        /** 
         * instance of WWJS client, not clientID or phone number 
        */
        this.Clients = Clients;

        /**
         * UserID of client who ready or has scaning the QR
         */
        this.ClientReady = ClientReady;
    }

    IsClientExists(UserID) {
        return typeof this.Clients[UserID] == 'undefined' ? false : true;
    }

    IsClientReady(UserID) {
        return this.ClientReady.includes(UserID);
    }

    AddClient(UserID, WWJsClient) {
        this.Clients[UserID] = WWJsClient;
        return true;
    }

    GetClient(UserID) {
        return this.Clients[UserID];
    }

    AddClientReady(UserID) {
        if (this.ClientReady.includes(UserID)) {
            return true;
        }

        this.ClientReady.push(UserID);
        return true;
    }

    GetClientReady() {
        return this.ClientReady;
    }

    RemoveClient(UserID) {
        delete this.Clients[UserID];
        delete this.ClientReady[UserID];
        return true;
    }

    GenerateID(UserID) {
        return UserID + "@c.us";
    }
}