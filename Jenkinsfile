#!/usr/bin/env groovy

node {
    properties([disableConcurrentBuilds()])

    try {

        def remote = [:]
        remote.name = 'cz-cmc-rs0'
        remote.host = '172.20.1.18'
        remote.user = 'chozoi'
        remote.allowAnyHosts = true

        project = "cz-crawler-schedule"
        dockerRepo = "dockerhub.infra.chozoi.com"
        imagePrefix = "ci"
        dockerFile = "Dockerfile"
        imageName = "${dockerRepo}/${imagePrefix}/${project}"
        buildNumber = "${env.BUILD_NUMBER}"
        k8sCluster = "local"
        dockerComposeDevFile = "docker-compose.yml"

        stage('checkout code') {
            checkout scm
            sh "git checkout ${env.BRANCH_NAME} && git reset --hard origin/${env.BRANCH_NAME}"
        }

        stage('build') {
            sh """
                egrep -q '^FROM .* AS builder\$' ${dockerFile} \
                && docker build -t ${imageName}-stage-builder --target builder -f ${dockerFile} .
                docker build -t ${imageName}:${env.BRANCH_NAME} -f ${dockerFile} .
            """
        }
        stage('push') {
            sh """
                docker push ${imageName}:${env.BRANCH_NAME}
                docker tag ${imageName}:${env.BRANCH_NAME} ${imageName}:${env.BRANCH_NAME}-build-${buildNumber}
                docker push ${imageName}:${env.BRANCH_NAME}-build-${buildNumber}
            """
        }
        switch (env.BRANCH_NAME) {
            case 'develop':
                stage('push docker-compose file') {
                    sh """
                        rsync -aurv ${dockerComposeDevFile} ${remote.host}::chozoi-apps/${project}/
                        export IMAGE_BUILD=${imageName}:${env.BRANCH_NAME}-build-${buildNumber}
                        ssh -o StrictHostKeyChecking=no ${remote.user}@${remote.host} 'export IMAGE_BUILD=${imageName}:${env.BRANCH_NAME}-build-${buildNumber} && cd /chozoi/${project}/ && docker-compose -f ${dockerComposeDevFile} down && docker-compose -f ${dockerComposeDevFile} up -d'
                        #k8sctl _deploy_rancher_dev ${k8sCluster} ${project}
                    """
                }
                break
            case 'master':
                stage('push docker-compose file') {
                    sh """
                        rsync -aurv ${dockerComposeDevFile} ${remote.host}::chozoi-apps/${project}/
                        export IMAGE_BUILD=${imageName}:${env.BRANCH_NAME}-build-${buildNumber}
                        ssh -o StrictHostKeyChecking=no ${remote.user}@${remote.host} 'export IMAGE_BUILD=${imageName}:${env.BRANCH_NAME}-build-${buildNumber} && cd /chozoi/${project}/ && docker-compose -f ${dockerComposeDevFile} down && docker-compose -f ${dockerComposeDevFile} up -d'
                        #k8sctl _deploy_rancher_dev ${k8sCluster} ${project}
                    """
                }
                break
        }

    } catch (e) {
        currentBuild.result = "FAILED"
        throw e
    }
}
