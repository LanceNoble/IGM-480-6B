let video;
let poseNet;
let pose;

let brain;
let label;

let state = 'waiting';

let score = 0;
let snakeSize = 20;
let directions = {
    'l': {
        x: -1,
        y: 0
    },
    'u': {
        x: 0,
        y: -1
    },
    'r': {
        x: 1,
        y: 0
    },
    'd': {
        x: 0,
        y: 1
    }
};
let currentDirection = directions['r'];
let snakePositions = [];
snakePositions.push(
    {
        x: 240,
        y: 240
    }
);
let appleX = getRandomInt(0, 500 / snakeSize);
let appleY = getRandomInt(0, 500 / snakeSize);

// function keyPressed() {
//     if (key == 's')
//         brain.saveData();
//     else {
//         label = key;
//         state = 'collecting';
//         console.log('collecting')
//         setTimeout(() => {
//             state = 'waiting';
//             console.log('waiting')
//         }, 10000);
//     }
// }

function setup() {
    createCanvas(500, 500);
    noStroke();
    video = createCapture(VIDEO);
    video.hide();

    poseNet = ml5.poseNet(video);

    poseNet.on('pose', (poses) => {
        if (poses.length === 0)
            return;

        pose = poses[0].pose;

        if (state !== 'collecting')
            return;

        let inputs = [];
        inputs.push(pose.leftEar.x);
        inputs.push(pose.leftEar.y);
        inputs.push(pose.rightEar.x);
        inputs.push(pose.rightEar.y);
        inputs.push(pose.nose.x);
        inputs.push(pose.nose.y);
        inputs.push(pose.leftEye.x);
        inputs.push(pose.leftEye.y);
        inputs.push(pose.rightEye.x);
        inputs.push(pose.rightEye.y);

        brain.addData(inputs, [label]);
    });

    let options = {
        inputs: 10,
        outputs: 4,
        task: 'classification',
        debug: true
    };

    brain = ml5.neuralNetwork(options);
    const modelInfo = {
        model: 'model/model.json',
        metadata: 'model/model_meta.json',
        weights: 'model/model.weights.bin'
    }
    brain.load(modelInfo, () => {
        console.log('model ready')
        classifyPose()
    })

    let rate = setInterval(() => {
        snakePositions.push(
            {
                x: snakePositions[snakePositions.length - 1].x + currentDirection.x * snakeSize,
                y: snakePositions[snakePositions.length - 1].y + currentDirection.y * snakeSize
            }
        );
        snakePositions.shift();

        if (snakePositions[snakePositions.length - 1].x < 0 || snakePositions[snakePositions.length - 1].x >= 500 ||
            snakePositions[snakePositions.length - 1].y < 0 || snakePositions[snakePositions.length - 1].y >= 500) {
            alert(`Game Over. Your score is ${score}`);
            snakePositions = [];
            snakePositions.push(
                {
                    x: 240,
                    y: 240
                }
            );
            appleX = getRandomInt(0, 500 / snakeSize);
            appleY = getRandomInt(0, 500 / snakeSize);
            background(255);
            score = 0;
            return;
        }

        for (let i = 0; i < snakePositions.length - 1; i++) {
            if (snakePositions[snakePositions.length - 1].x === snakePositions[i].x && snakePositions[snakePositions.length - 1].y === snakePositions[i].y) {
                alert(`Game Over. Your score is ${score}`);
                snakePositions = [];
                snakePositions.push(
                    {
                        x: 240,
                        y: 240
                    }
                );
                appleX = getRandomInt(0, 500 / snakeSize);
                appleY = getRandomInt(0, 500 / snakeSize);
                background(255);
                score = 0;
                return;
            }
        }

        if (snakePositions[snakePositions.length - 1].x == appleX * snakeSize && snakePositions[snakePositions.length - 1].y == appleY * snakeSize) {
            snakePositions.push(
                {
                    x: snakePositions[snakePositions.length - 1].x + currentDirection.x * snakeSize,
                    y: snakePositions[snakePositions.length - 1].y + currentDirection.y * snakeSize
                }
            );

            appleX = getRandomInt(0, 500 / snakeSize);
            appleY = getRandomInt(0, 500 / snakeSize);

            score++;
        }
    }, 250)

    // brain.loadData('data.json', () => {
    //     brain.normalizeData();
    //     brain.train({epochs: 50}, () => {
    //         console.log('model trained');
    //         brain.save();
    //     });
    // })
}

function classifyPose() {
    if (pose) {
        let inputs = [];
        inputs.push(pose.leftEar.x);
        inputs.push(pose.leftEar.y);
        inputs.push(pose.rightEar.x);
        inputs.push(pose.rightEar.y);
        inputs.push(pose.nose.x);
        inputs.push(pose.nose.y);
        inputs.push(pose.leftEye.x);
        inputs.push(pose.leftEye.y);
        inputs.push(pose.rightEye.x);
        inputs.push(pose.rightEye.y);

        brain.classify(inputs, (error, results) => {
            if (results[0].label !== 'n' && (directions[results[0].label].x * -1 !== currentDirection.x || directions[results[0].label].y * -1 !== currentDirection.y))
                currentDirection = directions[results[0].label];

            classifyPose();
        })
    } else {
        setTimeout(classifyPose, 100);
    }
}

function draw() {
    background(255);

    push();
    translate(500, 0);
    scale(-1, 1);
    image(video, 0, 0);
    pop();

    push();
    noStroke();
    fill(255, 0, 0);
    square(appleX * snakeSize, appleY * snakeSize, snakeSize);
    pop();

    push();
    noStroke();
    fill(0, 255, 0);
    for (let i = 0; i < snakePositions.length; i++) {
        square(snakePositions[i].x, snakePositions[i].y, snakeSize);
    }
    pop();


    // push();
    // stroke(255, 0, 0);
    // strokeWeight(1);
    // for (let i = 0; i < width / snakeSize; i++) {
    //     line(i * snakeSize, 0, i * snakeSize, height);
    //     //line(0, i * snakeSize, width, i * snakeSize);
    // }
    // pop();

    if (!pose)
        return;

    // push();
    // fill(255, 0, 0);
    // ellipse(pose.leftEar.x, pose.leftEar.y, 16);
    // ellipse(pose.rightEar.x, pose.rightEar.y, 16);
    // pop();

    // push();
    // fill(0, 255, 0);
    // ellipse(pose.nose.x, pose.nose.y, 16);
    // pop();

    // push();
    // fill(0, 0, 255);
    // ellipse(pose.leftEye.x, pose.leftEye.y, 16);
    // ellipse(pose.rightEye.x, pose.rightEye.y, 16);
    // pop();


}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}
