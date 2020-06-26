const { exec } = require('child_process');
const fs = require('fs');
const { resolve } = require('path');

/**
 * Read the file contents
 * @param   {String}	file_name 	The name of the file to be read
 * @return 	{Array}					The array of each line content of the given file
 */
function getFileContent(file_name){
    try{
        return fs.readFileSync(file_name).toString();
    }
    catch(err){
        throw "Cannot get the contents from " + file_name;
    }
}
/**
 * Write the file with some content
 * @param  	{String}	file_name 	the name of the file to be rewritten
 * @param  	{String} 	content		The content to be written
 * @return 	{Promise}				Resolves after the contents have been written
 */
function writeFile(file_name, content){	
	try{
        fs.writeFileSync(file_name, content);
    }
    catch(err){
		throw "Cannot write to the file: " + file_name;
    }
}
/**
 * Install all the required dependencies.
 * @return  {Promise}   Resolves after the packages have been installed
 */
function installPackages(){
    console.log();
    console.log("Installing packages...");
    console.log();
    return new Promise((resolve, reject) => {
        exec('npm install fs express uuid open node-fetch tweetsodium process', (error, stdout) => {
            if(error){
                reject("\nPackages installation unsuccessful");
            }
            else{
                console.log("\nAll packages installed successfully");
                resolve();
            }
		});
    });
}
/**
 * Gets all the file names in a directory relative to the repository root directory
 * @param   {String}    dir_name 	The relative path of directory whose file contents are required
 * @return  {Promise}			    Resolves the list of files in the directory
 */
function getFilesInDirectory(dir_name){
    return new Promise((resolve, reject) => {
        exec('ls "'+dir_name+'"', (error, stdout) => {
            if(error){
                reject("Obtaining the file names in " + dir_name + " unsuccessful.");
            }
            else{
                resolve(stdout.split("\n"));
            }
        });
    });
}
/**
 * Chech whether the file with same name exists or not
 * @param   {String}    files 	The list of all the files in the repository
 * @param   {String}    file    The hook name to be checked & replace
 * @return  {Boolean}		    Return the boolean whether the file with same name exists or not
 */
function checkFileExists(files, file){
    for(var file_iterator = 0; file_iterator < files.length; file_iterator++){
        if(files[file_iterator] === file){
            return true;
        }
    }
    return false;
}
/**
 * Rename a file with new name
 * @param   {String}    oldFile 	The relative path to Old File
 * @param   {String}    newFile     The relative path to New File
 * @return  {Promise}		        Resolves after the file name has been changes
 */
function renameFile(oldFile, newFile){
    try{
        fs.renameSync(oldFile, newFile);
    }
     catch(err){
         throw "Unable to rename the file " + oldFile;
     }
}
/**
 * Append a file
 * @param   {String}    file_name 	The file to be appended
 * @param   {String}    content     The content that will be added
 * @return  {Promise}		        Resolves after the file has been appended
 */
function appendFile(file_name, content){
    try{
        fs.appendFileSync(file_name, content);
    }
    catch(err){
        throw "Cannot append to the file: " + file_name;
    }
}
/**
 * Create a Directory in the repository
 * @param   {String}    dir_name    The relative path to the directory
 * @return  {Promise} 	            Resolves after the directory has been created
 */
function createDirectory(dir_name){
    return new Promise((resolve, reject) => {
        exec('mkdir "'+dir_name+'"', (error, stdout) => {
            if(error){
                reject("Unable to create the directory: " + dir_name);
            }
            else{
                resolve();
            }
		});
    });
}

async function main(){
    try{
        await installPackages();
        var hooks = await getFilesInDirectory(".git/hooks");
        if(checkFileExists(hooks, "pre-commit")){
            renameFile(".git/hooks/pre-commit", ".git/hooks/pre-commit.bkp");
        }
        if(checkFileExists(hooks, "pre-push")){
            renameFile(".git/hooks/pre-push", ".git/hooks/pre-push.bkp");
        }
        var open_workflow_run_text = await getFileContent(__dirname+'/open_workflow_run');
        writeFile('open_workflow_run', open_workflow_run_text);

        var pre_push_text = await getFileContent(__dirname+'/pre-push');
        writeFile('.git/hooks/pre-push', pre_push_text);

        var pre_commit_text = await getFileContent(__dirname+'/pre-commit');
        writeFile('.git/hooks/pre-commit', pre_commit_text);
        await createDirectory('templates/node');
        var workflow_text = await getFileContent(__dirname + '/templates/node/workflow.yml');
        writeFile('templates/node/workflow.yml', workflow_text);

        var config_content = await getFileContent(__dirname+'/config.yml');
        writeFile('config.yml', config_content);

        var extra_files = ['', '/open_workflow_run', '/config.yml','templates/'];
        appendFile('.gitignore', extra_files.join("\n"));
    }
    catch(err){
        console.log(err);
        console.log("\nProgram didn't run successfully.. Exitting..");
        process.exit(1);
    }
    
    console.log("Visit https://github.com/shubham-agarwal-27/hooks-deploy-to-azure/blob/master/README.md for any information.\n")
    console.log("Or you can open config.yml file created in your repository to get started with the deployment.");
    console.log();
}

main();