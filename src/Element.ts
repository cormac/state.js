/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
 
/**
 * Namespace for the finite state machine classes.
 * @module fsm
 */
module fsm {
	/**
	 * An abstract class used as the base for the Region and Vertex classes.
	 * An element is any part of the tree structure that represents a composite state machine model.
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
		constructor(name: string) {
			this.name = name;
		}

		/**
		 * Returns the parent element of this element.
		 * @method getParent
		 * @returns {Element} The parent element of the element.
		 */
		getParent(): Element {
			return; // note this is an abstract method.
		}

		/**
		 * Returns the root element within the state machine model.
		 * @method root
		 * @returns {StateMachine} The root state machine element.
		 */
		root(): StateMachine {
			return this.getParent().root();
		}

		/**
		 * Returns the ancestors of the element.
		 * The ancestors are returned as an array of elements, staring with the root element and ending with this elemenet.
		 */
		ancestors(): Array<Element> {
			return (this.getParent() ? this.getParent().ancestors() : []).concat(this);
		}

		/**
		 * Determines if an element is active within a given state machine instance.
		 * @method isActive
		 * @param {IActiveStateConfiguration} instance The state machine instance.
		 * @returns {boolean} True if the element is active within the state machine instance.
		 */
		isActive(instance: IActiveStateConfiguration): boolean {
			return this.getParent().isActive(instance);
		}

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