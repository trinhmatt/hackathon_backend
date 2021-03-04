
const dbHelpers = {
    addGoalToUser: (data, user) => {
        return new Promise( (resolve, reject) => {
            user.goals.push(data);
            user.save( (err) => {
                if (!err) {
                    resolve()
                } else {
                    reject(err);
                }
            })
        })
        
    },
    createConversation: (users, ConversationModel) => {
        return new Promise( (resolve, reject) => {
            const convObj = {
                users,
                messages: []
            }
            let newConv = new ConversationModel(convObj);

            newConv.save( (err) => {
                err ? reject(err) : resolve(newConv);
            })
        })
    }
}

module.exports = dbHelpers;