/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * An abstract class used as the base for the Region and Vertex classes.
	 * An element is a node within the tree structure that represents a composite state machine model.
	 * @class Element
	 */
	export class Element {
		/**
		 * The symbol used to separate element names within a fully qualified name.
		 * Change this static member to create different styles of qualified name generated by the toString method.
		 * @member {string}
		 */
		public static namespaceSeparator = ".";

		/**
		 * The parent element of this element.
		 * @member {Element}
		 */
		public parent: Element;

		/**
		 * The name of the element.
		 * @member {string}
		 */
		public name: string;

		/**
		 * The fully qualified name of the element.
		 * @member {string}
		 */
		public qualifiedName: string;

		/**
		 * Creates a new instance of the element class.
		 * @param {string} name The name of the element.
		 */
		public constructor(name: string, parent: Element) {
			this.parent = parent;
			this.name = name;
			this.qualifiedName = parent ? (parent.qualifiedName + "." + name) : name;
		}

		/**
		 * Returns the root element within the state machine model.
		 * @method getRoot
		 * @returns {StateMachine} The root state machine element.
		 */
		public getRoot(): StateMachine {
			return this.parent.getRoot(); // NOTE: need to keep this dynamic as a state machine may be embedded within another
		}

		/**
		 * Accepts an instance of a visitor.
		 * @method accept
		 * @param {Visitor<TArg>} visitor The visitor instance.
		 * @param {TArg} arg An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
		 */
		public accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any { /* virtual method */ }

		/**
		 * Returns a the element name as a fully qualified namespace.
		 * @method toString
		 * @returns {string}
		 */
		public toString(): string {
			return this.qualifiedName;
		}
	}
}