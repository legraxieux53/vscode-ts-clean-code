// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "ts-clean-code" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "ts-clean-code.generateModelBody",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      } // aucun editeur

      const selection = editor.selection;
      let text = editor.document.getText(selection);

      if (!(text.length > 0)) {
        vscode.window.showErrorMessage("no selected text");
        return;
      }

      try {
        const gettersAndSetters = createGettersSetters(text);
        const jsonMap = createJsonMap(text);
        const newInstance = createNewInstance(text);

        editor.edit((edit) =>
          editor.selections.forEach((selection) => {
            edit.insert(selection.start, newInstance);
            edit.insert(selection.end, gettersAndSetters);
            edit.insert(selection.end, jsonMap);
          })
        );

        vscode.commands.executeCommand("editor.action.formatSelection");
      } catch (e) {
        console.log(e);
        vscode.window.showErrorMessage(
          'Something went wrong! try that the properties are in this format! "private name: string;"'
        );
      }
      // vscode.window.showInformationMessage('Hello World from ts clean code!');
    }
  );

  context.subscriptions.push(disposable);
}

function getProperties(textProperties: string) {
  const propertieExpressions = textProperties.split(
    new RegExp("[ ]*[;][ ]*", "g")
  );
  const propertieExpressionsWithoutPrivate: any = [];
  propertieExpressions.forEach((prop) => {
    const result = prop.split(new RegExp("[ ]*private[ ]+", "g"))[1];
    if (result) {
      propertieExpressionsWithoutPrivate.push(result);
    }
  });
  const properties: { propName: string; propType: string }[] = [];
  propertieExpressionsWithoutPrivate.forEach((prop: any) => {
    const result = prop.split(new RegExp("[ ]*[:][ ]*", "g"));
    if (result) {
      properties.push({ propName: result[0], propType: result[1] });
    }
  });
  return properties;
}

function classify(name: string): string {
  return name.charAt(0).toUpperCase() + name.substring(1);
}

function createGettersSetters(textProperties: string): string {
  const properties = getProperties(textProperties);
  const constructProperty = (property: {
    propName: string;
    propType: string;
  }) => {
    return `
  
			  get${classify(property.propName)}(): ${property.propType} {
				  return this.${property.propName};
			  }
			  
			  set${classify(property.propName)}(prop: ${property.propType}): void {
				  this.${property.propName} = prop;
			  }
		  `;
  };

  let result = "";
  properties.map((prop) => (result += constructProperty(prop)));
  return result;
}

function createNewInstance(textProperties: string): string {
  const properties = getProperties(textProperties);
  const constructProperty = (property: {
    propName: string;
    propType: string;
  }) => {
    return `this.set${classify(property.propName)}(data && data.${
      property.propName
    });
			  `;
  };

  let result = `
  
		constructor(data?: any) {
	  `;
  properties.map((prop) => (result += constructProperty(prop)));

  result += `
	  }
	  
	  `;
  return result;
}

function createJsonMap(textProperties: string): string {
  const properties = getProperties(textProperties);
  const constructProperty = (property: {
    propName: string;
    propType: string;
  }) => {
    return `${property.propName}: this.${property.propName},
		  `;
  };

  let result = `
		jsonMap(): any {
		  return {
	  `;
  properties.map((prop) => (result += constructProperty(prop)));

  result += `
		  };
		}`;
  return result;
}

// this method is called when your extension is deactivated
export function deactivate() {}
