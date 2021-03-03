const dbHelpers = {
    addGoalToUser: (data, user) => {
        return new Promise( (resolve, reject) => {
            const newGoal = {
                goalType: data.goalType,
                targetGoal: data.targetGoal,
                currentProgress: 0,
                deadline: data.deadline,
                dailyProgress: [],
                buddy: data.buddy
            }
            user.goals.push(newGoal);
            user.save( (err) => {
                if (!err) {
                    resolve()
                } else {
                    reject(err);
                }
            })
        })
        
    }
}

module.exports = dbHelpers;