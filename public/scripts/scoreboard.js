window.onload = () => {
    const score = document.getElementById('score');
    const accuracyAvg = document.getElementById('accuracyAvg');
    const gradeAvg = document.getElementById('gradeAvg');
    const div = document.getElementById('referees');

    setInterval(() => {show(score, accuracyAvg, gradeAvg, div)}, 1000);
}

function averageArray(stringArray) {
    const numArray = stringArray.map(str => parseFloat(str, 10));
    const validNumbers = numArray.filter(num => !isNaN(num));
    const sumArray = validNumbers.reduce((i, currentValue) => i + currentValue);
    const avg = sumArray / validNumbers.length;
    return avg.toFixed(2);
}

function sum(number1, number2) {
    return ((parseFloat(number1) + parseFloat(number2))).toFixed(2);
}

let calculated = false;
let isNotShowing = false;
function show(score, accuracyAvg, gradeAvg, div) {
    if (Boolean(localStorage.getItem('show'))) {
        if (!calculated) {
            const numArbitros = parseInt(localStorage.getItem('arbitros'));
            const gradesPrecision = localStorage.getItem("gradesPrecision").split(',');
            const accuraciesApresentation = localStorage.getItem("accuraciesApresentation").split(',');
            const precisionMaxAndMin = numArbitros !== 3 ? localStorage.getItem('precisionMaxAndMin').split(',') : null
            const apresentationMaxAndMin = numArbitros !== 3 ? localStorage.getItem('apresentationMaxAndMin').split(',') : null

            const cleanPrecision = gradesPrecision.filter((grade, index) =>  {
                if(precisionMaxAndMin){
                    if (index === parseInt(precisionMaxAndMin[0])) return;
                    if (index === parseInt(precisionMaxAndMin[1])) return;
                }
                return grade;
            });
        
            const cleanApresentation = accuraciesApresentation.filter((grade, index) => {
                if(apresentationMaxAndMin){
                    if (index === parseInt(apresentationMaxAndMin[0])) return;
                    if (index === parseInt(apresentationMaxAndMin[1])) return;
                }
                return grade;
            })
            
            const avgPrecision = averageArray(cleanPrecision);
            const avgApresentation = averageArray(cleanApresentation);
        
            let ul = document.createElement('ul');
            ul.id = "tempReferees";
            ul.className = "tempReferees"
                const competitor = document.createElement('il');
                competitor.textContent = localStorage.getItem("competitor");
                competitor.className = 'competitor grid-item';
            ul.appendChild(competitor);

            for (let index = 0; index < parseInt(localStorage.getItem('arbitros')); index++) {
                const gradePrecision = gradesPrecision[index];
                const accuracyApresentation = accuraciesApresentation[index];
                let newReferee = document.createElement('il');
                    newReferee.className = 'referee';
                    let name = document.createElement('p');
                    name.className = 'name grid-item';
                    name.textContent = `${index+1}`;
                newReferee.appendChild(name);
                    let newAccApresentation = document.createElement('p');
                    newAccApresentation.className = 'accuracy grid-item';
                    newAccApresentation.textContent = `${accuracyApresentation}`;
                    if(apresentationMaxAndMin){
                        if (index === parseInt(apresentationMaxAndMin[0]) || index === parseInt(apresentationMaxAndMin[1])){
                            newAccApresentation.className = 'cancel grid-item';
                            newAccApresentation.style.textDecoration = 'line-through';
                        }
                    }
                newReferee.appendChild(newAccApresentation);
                    let newGradePrecision = document.createElement('p');
                    newGradePrecision.className = 'grade grid-item';
                    newGradePrecision.textContent = `${gradePrecision}`;
                    if(precisionMaxAndMin){
                        if (index === parseInt(precisionMaxAndMin[0]) || index === parseInt(precisionMaxAndMin[1])){
                            newGradePrecision.className = 'cancel grid-item';
                            newGradePrecision.style.textDecoration = 'line-through';
                        }
                    }

                newReferee.appendChild(newGradePrecision);

                ul.appendChild(newReferee);
            }
            div.appendChild(ul);

            score.innerHTML = `${sum(avgApresentation, avgPrecision)}`;
            accuracyAvg.innerHTML = `${avgApresentation}`;
            gradeAvg.innerHTML = `${avgPrecision}`;

            localStorage.setItem('result', `${avgApresentation},${avgPrecision},${sum(avgApresentation, avgPrecision)}`);
            
            calculated = true;
            isNotShowing = false;
            console.log("foi");
        }
    } else {
        calculated = false;
        const div = document.getElementById("tempReferees");
        if (div) {
          div.remove();  
        }
        if (!isNotShowing) {
            score.innerHTML = "-";
            accuracyAvg.innerHTML = `-`;
            gradeAvg.innerHTML = `-`;
            localStorage.removeItem('result');
            isNotShowing = true;
            console.log('agora não');
        }
    }
};